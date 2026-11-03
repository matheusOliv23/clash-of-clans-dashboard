import "server-only";

import { cache } from "react";
import { connection } from "next/server";

import {
  observedFromClanWar,
  observedFromWarLog,
} from "@/features/members/from-api";
import type {
  MemberStatsSnapshot,
  ObservedWar,
  RosterMember,
} from "@/features/members/metrics";
import { rankedSeasonFromParts } from "@/features/members/ranked-league";
import { persistWars, readPersistedWars } from "@/features/members/persist";
import { orientClanWar, preparedLeagueRounds } from "@/features/war/league";
import { requireEnv } from "@/lib/env";
import {
  getClan,
  getClanMembers,
  getCurrentLeagueGroup,
  getCurrentWar,
  getLeagueWar,
  getWarLog,
} from "@/services/clash-of-clans/clans";
import {
  getLeagueTiers,
  getPlayerLeagueHistory,
} from "@/services/clash-of-clans/players";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import {
  ClashRequestError,
  normalizeClanTag,
} from "@/services/clash-of-clans/tags";
import type { ClashClanMember, ClashWarLogEntry } from "@/types/clash-of-clans";

export const loadMemberStats = cache(async (): Promise<MemberStatsSnapshot> => {
  await connection();
  const clanTag = normalizeClanTag(requireEnv("CLAN_TAG"));
  const notes: string[] = [];
  const wars = new Map<string, ObservedWar>();

  const clan = await getClan(clanTag);
  const roster = await listRoster(clanTag);
  const seasonStart = await collectLeagueWars(clanTag, wars, notes);
  await collectCurrentWar(clanTag, wars, notes);
  await collectWarLog(clanTag, wars, notes);

  const ranked = await collectRankedLeague(
    roster.map((member) => member.tag),
    notes,
  );
  const observed = [...wars.values()];
  let source = observed;
  let persistenceError: string | null = null;

  try {
    await persistWars(clanTag, clan.name, observed);
    source = mergeWars(observed, await readPersistedWars(clanTag));
  } catch (error) {
    persistenceError = persistenceMessage(error);
  }

  return {
    clanName: clan.name,
    clanTag: clan.tag,
    wars: source,
    roster,
    seasonStart,
    generatedAt: new Date().toISOString(),
    notes,
    persistenceError,
    rankedTiers: ranked.tiers,
    rankedPlayers: ranked.players,
  };
});

async function listRoster(clanTag: string): Promise<RosterMember[]> {
  const members: ClashClanMember[] = [];
  let after: string | undefined;

  for (let page = 0; page < 5; page += 1) {
    const result = await getClanMembers(clanTag, { limit: 50, after });
    members.push(...result.items);
    after = result.paging?.cursors?.after ?? result.paging?.after;
    if (!after) {
      break;
    }
  }

  return members.map((member) => ({
    tag: member.tag,
    name: member.name,
    townHall: member.townHallLevel,
    role: member.role,
    trophies: member.trophies,
    leagueName: member.leagueTier?.name ?? member.league?.name ?? null,
    donations: member.donations,
    donationsReceived: member.donationsReceived,
    clanRank: member.clanRank,
  }));
}

async function collectWarLog(
  clanTag: string,
  wars: Map<string, ObservedWar>,
  notes: string[],
): Promise<void> {
  try {
    const entries: ClashWarLogEntry[] = [];
    let after: string | undefined;

    for (let page = 0; page < 4; page += 1) {
      const result = await getWarLog(clanTag, { limit: 50, after });
      entries.push(...result.items);
      after = result.paging?.cursors?.after ?? result.paging?.after;
      if (!after) {
        break;
      }
    }

    let withoutRoster = 0;
    for (const entry of entries) {
      const war = observedFromWarLog(entry);
      if (!war) {
        continue;
      }
      if (war.members === null) {
        withoutRoster += 1;
      }
      rememberWar(wars, war);
    }

    if (withoutRoster > 0) {
      notes.push(
        `O war log oficial listou ${withoutRoster} guerras clássicas encerradas sem o elenco e sem os ataques de cada membro. Elas não entram na média individual.`,
      );
    }
  } catch (error) {
    notes.push(apiNote("O war log", error));
  }
}

async function collectLeagueWars(
  clanTag: string,
  wars: Map<string, ObservedWar>,
  notes: string[],
): Promise<string | null> {
  try {
    const group = await getCurrentLeagueGroup(clanTag);
    if (group.state === "groupNotFound" || group.state === "notInWar") {
      return null;
    }

    const rounds = preparedLeagueRounds(group);
    const fetched = await Promise.all(
      rounds.flatMap((round) =>
        round.warTags.map(async (warTag) => {
          try {
            const war = await getLeagueWar(warTag);
            return { round: round.round, war };
          } catch (error) {
            if (error instanceof ClashApiError && error.status === 404) {
              return null;
            }
            throw error;
          }
        }),
      ),
    );

    for (const item of fetched) {
      if (!item) {
        continue;
      }
      const oriented = orientClanWar(item.war, clanTag);
      if (!oriented) {
        continue;
      }
      rememberWar(
        wars,
        observedFromClanWar(oriented, {
          kind: "league",
          season: group.season ?? null,
          round: item.round,
        }),
      );
    }

    return group.season ?? null;
  } catch (error) {
    notes.push(apiNote("A liga de guerra", error));
    return null;
  }
}

async function collectCurrentWar(
  clanTag: string,
  wars: Map<string, ObservedWar>,
  notes: string[],
): Promise<void> {
  try {
    const war = await getCurrentWar(clanTag);
    rememberWar(
      wars,
      observedFromClanWar(war, { kind: "regular", season: null, round: null }),
    );
  } catch (error) {
    notes.push(apiNote("A guerra atual", error));
  }
}

async function collectRankedLeague(
  tags: string[],
  notes: string[],
): Promise<{
  tiers: Record<string, string>;
  players: MemberStatsSnapshot["rankedPlayers"];
}> {
  const tiers: Record<string, string> = {};

  try {
    for (const tier of await getLeagueTiers()) {
      if (tier.name.trim()) {
        tiers[String(tier.id)] = tier.name;
      }
    }
  } catch (error) {
    notes.push(apiNote("Os nomes das ligas", error));
  }

  const players: MemberStatsSnapshot["rankedPlayers"] = [];
  let failed = 0;
  const pending = [...tags];

  async function worker(): Promise<void> {
    while (pending.length > 0) {
      const tag = pending.shift();
      if (!tag) {
        return;
      }

      try {
        const history = await getPlayerLeagueHistory(tag);
        players.push({
          tag,
          seasons: (history.items ?? []).flatMap((item) => {
            const season = rankedSeasonFromParts(item);
            return season ? [season] : [];
          }),
        });
      } catch {
        failed += 1;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(6, tags.length) }, () => worker()),
  );

  if (failed > 0) {
    notes.push(
      failed === 1
        ? "O histórico de liga de 1 membro não entrou nesta leitura."
        : `O histórico de liga de ${failed} membros não entrou nesta leitura.`,
    );
  }

  return { tiers, players };
}

function rememberWar(wars: Map<string, ObservedWar>, war: ObservedWar | null) {
  if (!war) {
    return;
  }

  const key = `${war.kind}|${war.endTime}|${war.opponentTag}`;
  const existing = wars.get(key);
  if (!existing) {
    wars.set(key, war);
    return;
  }

  wars.set(key, {
    ...existing,
    finished: existing.finished || war.finished,
    attacksPerMember: war.attacksPerMember ?? existing.attacksPerMember,
    members: war.members ?? existing.members,
    opponentName: war.opponentName || existing.opponentName,
    startTime: war.startTime ?? existing.startTime,
    season: war.season ?? existing.season,
    round: war.round ?? existing.round,
  });
}

function mergeWars(
  observed: readonly ObservedWar[],
  persisted: readonly ObservedWar[],
): ObservedWar[] {
  const merged = new Map<string, ObservedWar>();
  for (const war of [...persisted, ...observed]) {
    rememberWar(merged, war);
  }
  return [...merged.values()];
}

function apiNote(source: string, error: unknown): string {
  if (error instanceof ClashRequestError || error instanceof ClashApiError) {
    return `${source} não entrou nesta leitura: ${error.message}`;
  }
  return `${source} não entrou nesta leitura.`;
}

function persistenceMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return "O banco não aceitou a conexão. As médias usam só o que a API devolveu agora e nada foi gravado.";
  }

  if (error instanceof Error && error.message.includes("não está definida")) {
    return error.message;
  }

  return "Não foi possível gravar as guerras no banco. As médias usam só o que a API devolveu agora.";
}
