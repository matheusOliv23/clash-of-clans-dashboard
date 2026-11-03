import "server-only";

import { cache } from "react";
import { connection } from "next/server";

import { requireEnv } from "@/lib/env";
import {
  getClan,
  getCurrentLeagueGroup,
  getCurrentWar,
  getLeagueWar,
} from "@/services/clash-of-clans/clans";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import {
  ClashRequestError,
  normalizeClanTag,
} from "@/services/clash-of-clans/tags";
import {
  isActiveWarState,
  orientClanWar,
  pickCurrentLeagueWar,
  preparedLeagueRounds,
  type PreparedLeagueRound,
} from "@/features/war/league";
import {
  clanInitials,
  formatClashDay,
  presentCurrentWar,
  stateLabel,
  type DashboardResult,
  type DashboardTone,
} from "@/features/war/present";
import type { ClashCurrentWar } from "@/types/clash-of-clans";

export type ClanIdentity = {
  ok: boolean;
  name: string;
  tag: string;
  initials: string;
  badgeUrl?: string;
};

export const loadClanIdentity = cache(async (): Promise<ClanIdentity> => {
  await connection();

  try {
    const tag = normalizeClanTag(requireEnv("CLAN_TAG"));
    const clan = await getClan(tag);

    return {
      ok: true,
      name: clan.name,
      tag: clan.tag,
      initials: clanInitials(clan.name),
      badgeUrl:
        clan.badgeUrls.small ?? clan.badgeUrls.medium ?? clan.badgeUrls.large,
    };
  } catch {
    return {
      ok: false,
      name: "Clã não carregado",
      tag: configuredTag(),
      initials: "?",
    };
  }
});

export type ActiveWar =
  | {
      status: "war";
      war: ClashCurrentWar;
      leagueSeason: string | null;
      leagueRound: number | null;
    }
  | {
      status: "empty";
      stateLabel: string;
      stateTone: DashboardTone;
      title: string;
      message: string;
    }
  | { status: "error"; message: string };

export const loadActiveWar = cache(async (): Promise<ActiveWar> => {
  await connection();

  try {
    const tag = normalizeClanTag(requireEnv("CLAN_TAG"));
    const current = await getCurrentWar(tag);
    const regular = presentCurrentWar(current, new Date());

    if (regular.status === "board") {
      return {
        status: "war",
        war: current,
        leagueSeason: null,
        leagueRound: null,
      };
    }

    const league = await loadLeagueWar(tag);
    if (league) {
      return league;
    }

    if (regular.status === "empty") {
      return {
        status: "empty",
        stateLabel: regular.stateLabel,
        stateTone: regular.stateTone,
        title: regular.title,
        message: regular.message,
      };
    }

    return {
      status: "error",
      message: "Não foi possível ler a guerra atual.",
    };
  } catch (error) {
    return { status: "error", message: publicClashMessage(error) };
  }
});

export const loadDashboard = cache(async (): Promise<DashboardResult> => {
  const active = await loadActiveWar();

  if (active.status === "war") {
    return presentCurrentWar(active.war, new Date(), {
      ...(active.leagueSeason ? { leagueSeason: active.leagueSeason } : {}),
      ...(active.leagueRound !== null
        ? { leagueRound: active.leagueRound }
        : {}),
    });
  }

  if (active.status === "empty") {
    return {
      status: "empty",
      stateLabel: active.stateLabel,
      stateTone: active.stateTone,
      title: active.title,
      message: active.message,
    };
  }

  return { status: "error", message: active.message };
});

async function loadLeagueWar(tag: string): Promise<ActiveWar | null> {
  let group;

  try {
    group = await getCurrentLeagueGroup(tag);
  } catch (error) {
    if (error instanceof ClashApiError && error.status === 404) {
      return null;
    }

    throw error;
  }

  if (group.state === "notInWar" || group.state === "groupNotFound") {
    return null;
  }

  const rounds = preparedLeagueRounds(group);
  const selected = await selectLeagueWar(rounds, tag);

  if (!selected) {
    return {
      status: "empty",
      stateLabel: "Liga",
      stateTone: "preparacao",
      title: "Rodada da liga ainda sem guerra",
      message:
        "O grupo da liga existe, mas a API ainda não liberou a guerra deste clã.",
    };
  }

  return {
    status: "war",
    war: selected.war,
    leagueSeason: group.season ?? null,
    leagueRound: selected.round,
  };
}

async function selectLeagueWar(
  rounds: PreparedLeagueRound[],
  clanTag: string,
): Promise<{ round: number; war: ClashCurrentWar } | null> {
  for (let index = rounds.length - 1; index >= 0; index -= 1) {
    const round = rounds[index];
    if (!round) {
      continue;
    }

    const ours = await findClanWar(round, clanTag);
    if (!ours) {
      continue;
    }

    if (!isActiveWarState(ours.state) && index > 0) {
      const previous = rounds[index - 1];
      if (previous) {
        const earlier = await findClanWar(previous, clanTag);
        if (earlier && isActiveWarState(earlier.state)) {
          return { round: previous.round, war: earlier };
        }
      }
    }

    return { round: round.round, war: ours };
  }

  return null;
}

async function findClanWar(
  round: PreparedLeagueRound,
  clanTag: string,
): Promise<ClashCurrentWar | null> {
  const wars = await Promise.all(
    round.warTags.map(async (warTag) => {
      try {
        return await getLeagueWar(warTag);
      } catch (error) {
        if (error instanceof ClashApiError && error.status === 404) {
          return null;
        }

        throw error;
      }
    }),
  );

  for (const war of wars) {
    if (!war) {
      continue;
    }

    const oriented = orientClanWar(war, clanTag);
    if (oriented) {
      return oriented;
    }
  }

  return null;
}

export type LeagueRoundSummary = {
  round: number;
  opponentName: string;
  stateLabel: string;
  dayLabel: string | null;
};

export type ChosenWar =
  | {
      status: "war";
      war: ClashCurrentWar;
      leagueSeason: string | null;
      leagueRound: number | null;
      currentRound: number | null;
      rounds: LeagueRoundSummary[];
      unavailableRound: number | null;
    }
  | {
      status: "empty";
      stateLabel: string;
      stateTone: DashboardTone;
      title: string;
      message: string;
    }
  | { status: "error"; message: string };

export const loadChosenWar = cache(
  async (requestedRound: number | null): Promise<ChosenWar> => {
    await connection();

    try {
      const tag = normalizeClanTag(requireEnv("CLAN_TAG"));
      const current = await getCurrentWar(tag);
      const regular = presentCurrentWar(current, new Date());

      if (regular.status === "board") {
        return {
          status: "war",
          war: current,
          leagueSeason: null,
          leagueRound: null,
          currentRound: null,
          rounds: [],
          unavailableRound: null,
        };
      }

      const league = await loadLeagueChoices(tag);
      if (!league) {
        if (regular.status === "empty") {
          return {
            status: "empty",
            stateLabel: regular.stateLabel,
            stateTone: regular.stateTone,
            title: regular.title,
            message: regular.message,
          };
        }

        return {
          status: "error",
          message: "Não foi possível ler a guerra atual.",
        };
      }

      if (league.wars.length === 0) {
        return {
          status: "empty",
          stateLabel: "Liga",
          stateTone: "preparacao",
          title: "Rodada da liga ainda sem guerra",
          message:
            "O grupo da liga existe, mas a API ainda não liberou a guerra deste clã.",
        };
      }

      const currentPick = pickCurrentLeagueWar(
        league.wars.map((entry) => ({
          round: entry.round,
          state: entry.war.state,
          war: entry.war,
        })),
      );
      const requested =
        requestedRound === null
          ? null
          : (league.wars.find((entry) => entry.round === requestedRound) ??
            null);
      const chosen = requested ?? currentPick;

      if (!chosen) {
        return {
          status: "empty",
          stateLabel: "Liga",
          stateTone: "preparacao",
          title: "Rodada da liga ainda sem guerra",
          message:
            "O grupo da liga existe, mas a API ainda não liberou a guerra deste clã.",
        };
      }

      return {
        status: "war",
        war: chosen.war,
        leagueSeason: league.season,
        leagueRound: chosen.round,
        currentRound: currentPick?.round ?? null,
        rounds: league.wars
          .map((entry) => ({
            round: entry.round,
            opponentName: entry.war.opponent?.name ?? "Oponente sem nome",
            stateLabel: stateLabel(entry.war.state),
            dayLabel: formatClashDay(
              entry.war.startTime ??
                entry.war.warStartTime ??
                entry.war.endTime,
            ),
          }))
          .sort((left, right) => left.round - right.round),
        unavailableRound:
          requestedRound !== null && requested === null ? requestedRound : null,
      };
    } catch (error) {
      return { status: "error", message: publicClashMessage(error) };
    }
  },
);

async function loadLeagueChoices(tag: string): Promise<{
  season: string | null;
  wars: { round: number; war: ClashCurrentWar }[];
} | null> {
  let group;

  try {
    group = await getCurrentLeagueGroup(tag);
  } catch (error) {
    if (error instanceof ClashApiError && error.status === 404) {
      return null;
    }

    throw error;
  }

  if (group.state === "notInWar" || group.state === "groupNotFound") {
    return null;
  }

  const rounds = preparedLeagueRounds(group);
  const found = await Promise.all(
    rounds.map(async (round) => {
      const war = await findClanWar(round, tag);
      return war ? { round: round.round, war } : null;
    }),
  );

  return {
    season: group.season ?? null,
    wars: found.flatMap((entry) => (entry ? [entry] : [])),
  };
}

function configuredTag(): string {
  try {
    return normalizeClanTag(requireEnv("CLAN_TAG"));
  } catch {
    return "Tag ausente";
  }
}

function publicClashMessage(error: unknown): string {
  if (error instanceof ClashRequestError || error instanceof ClashApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.includes("não está definida")) {
    return error.message;
  }

  return "Não foi possível consultar a API do Clash of Clans.";
}
