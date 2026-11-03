import type { RankedPlayerHistory } from "@/features/members/ranked-league";
import type { ObservedWar, RosterMember } from "@/features/members/metrics";

/**
 * A API oficial não envia a última vez que o jogador entrou.
 *
 * Ativo quando aparece pelo menos um destes sinais:
 * - doações maior que zero no contador atual do membro;
 * - ataque já registrado numa rodada da liga de guerra com elenco;
 * - o jogador está na semana mais nova de liga ranqueada devolvida para o clã.
 *
 * Inativo quando nenhum desses sinais aparece e a leitura trouxe
 * pelo menos um deles para comparar. Sem leitura quando a API não trouxe
 * doações, liga ranqueada nem elenco de liga de guerra.
 */

export type RosterStatus = "active" | "quiet" | "unknown";

export type RosterRow = {
  tag: string;
  name: string;
  role?: RosterMember["role"];
  roleLabel: string;
  townHall: number;
  donations: number | null;
  donationsReceived: number | null;
  status: RosterStatus;
  detail: string;
};

const ROLE_LABEL: Record<NonNullable<RosterMember["role"]>, string> = {
  leader: "Líder",
  coLeader: "Colíder",
  admin: "Ancião",
  member: "Membro",
  notMember: "Fora do clã",
};

const ROLE_RANK: Record<NonNullable<RosterMember["role"]>, number> = {
  leader: 0,
  coLeader: 1,
  admin: 2,
  member: 3,
  notMember: 4,
};

export function buildClanRoster(
  roster: readonly RosterMember[],
  rankedPlayers: readonly RankedPlayerHistory[],
  wars: readonly ObservedWar[],
): RosterRow[] {
  const newest = newestRankedWeek(rankedPlayers);
  const rankedByTag = new Map(
    rankedPlayers.map((player) => [player.tag, player.seasons]),
  );
  const warAttackers = leagueAttackers(wars);
  const hasLeagueRoster = wars.some(
    (war) => war.kind === "league" && war.members !== null,
  );

  return roster
    .map((member) => {
      const seasons = rankedByTag.get(member.tag) ?? [];
      const inNewestWeek =
        newest !== null &&
        seasons.some((season) => season.seasonId === newest.seasonId);
      const attacked = warAttackers.has(member.tag);
      const donated =
        typeof member.donations === "number" && member.donations > 0;
      const donationsKnown = typeof member.donations === "number";
      const active = donated || attacked || inNewestWeek;
      const comparable = donationsKnown || newest !== null || hasLeagueRoster;
      const status: RosterStatus = active
        ? "active"
        : comparable
          ? "quiet"
          : "unknown";
      const lastRanked = newestSeason(seasons);

      return {
        tag: member.tag,
        name: member.name,
        role: member.role,
        roleLabel: member.role
          ? ROLE_LABEL[member.role]
          : "Cargo não informado",
        townHall: member.townHall,
        donations: donationsKnown ? (member.donations ?? null) : null,
        donationsReceived:
          typeof member.donationsReceived === "number"
            ? member.donationsReceived
            : null,
        status,
        detail: detailFor({
          status,
          donated,
          attacked,
          inNewestWeek,
          donationsKnown,
          hasLeagueRoster,
          hasNewestWeek: newest !== null,
          newestAt: newest?.startedAt ?? null,
          lastRankedAt:
            !inNewestWeek && lastRanked ? lastRanked.startedAt : null,
        }),
      };
    })
    .sort((left, right) => {
      const byRole = roleRank(left.role) - roleRank(right.role);
      if (byRole !== 0) {
        return byRole;
      }
      const byHall = right.townHall - left.townHall;
      if (byHall !== 0) {
        return byHall;
      }
      return left.name.localeCompare(right.name, "pt-BR");
    });
}

function newestRankedWeek(players: readonly RankedPlayerHistory[]) {
  let newest: { seasonId: number; startedAt: number | null } | null = null;
  for (const player of players) {
    for (const season of player.seasons) {
      if (newest === null || season.seasonId > newest.seasonId) {
        newest = { seasonId: season.seasonId, startedAt: season.startedAt };
      }
    }
  }
  return newest;
}

function newestSeason(seasons: RankedPlayerHistory["seasons"]) {
  let newest: RankedPlayerHistory["seasons"][number] | null = null;
  for (const season of seasons) {
    if (newest === null || season.seasonId > newest.seasonId) {
      newest = season;
    }
  }
  return newest;
}

function leagueAttackers(wars: readonly ObservedWar[]): Set<string> {
  const tags = new Set<string>();
  for (const war of wars) {
    if (war.kind !== "league" || war.members === null) {
      continue;
    }
    for (const member of war.members) {
      if (member.attacks.length > 0) {
        tags.add(member.tag);
      }
    }
  }
  return tags;
}

function detailFor(input: {
  status: RosterStatus;
  donated: boolean;
  attacked: boolean;
  inNewestWeek: boolean;
  donationsKnown: boolean;
  hasLeagueRoster: boolean;
  hasNewestWeek: boolean;
  newestAt: number | null;
  lastRankedAt: number | null;
}): string {
  if (input.status === "unknown") {
    return "A leitura não trouxe doações, liga ranqueada nem elenco da liga de guerra. A API não informa o último login.";
  }

  if (input.status === "active") {
    const parts = [
      input.donated ? "Doou no contador atual" : null,
      input.attacked ? "Atacou na liga de guerra desta temporada" : null,
      input.inNewestWeek
        ? `Apareceu na semana mais nova da liga ranqueada${weekSuffix(input.newestAt)}`
        : null,
    ].filter((part): part is string => part !== null);
    return parts.join(". ") + ".";
  }

  const missing = [
    input.donationsKnown ? "sem doação no contador atual" : null,
    input.hasLeagueRoster ? "sem ataque na liga de guerra" : null,
    input.hasNewestWeek
      ? `fora da semana mais nova da liga ranqueada${weekSuffix(input.newestAt)}`
      : null,
  ].filter((part): part is string => part !== null);
  const last =
    input.lastRankedAt === null
      ? ""
      : ` A última semana devolvida foi ${formatWeek(input.lastRankedAt)}.`;
  return `Inativo: ${missing.join(", ")}. A API não informa o último login.${last}`;
}

function weekSuffix(startedAt: number | null): string {
  if (startedAt === null) {
    return "";
  }
  return ` (${formatWeek(startedAt)})`;
}

function formatWeek(startedAt: number): string {
  return new Date(startedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function roleRank(role: RosterMember["role"]): number {
  if (!role) {
    return ROLE_RANK.notMember + 1;
  }
  return ROLE_RANK[role];
}
