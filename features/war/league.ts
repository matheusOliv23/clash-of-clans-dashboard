import type { ClashCurrentWar, ClashLeagueGroup } from "@/types/clash-of-clans";

/** A API usa esta tag nas rodadas que ainda não foram preparadas. */
export const UNPREPARED_WAR_TAG = "#0";

export type PreparedLeagueRound = {
  round: number;
  warTags: string[];
};

export function preparedLeagueRounds(
  group: ClashLeagueGroup,
): PreparedLeagueRound[] {
  return (group.rounds ?? []).flatMap((round, index) => {
    const warTags = round.warTags.filter((tag) => tag !== UNPREPARED_WAR_TAG);
    return warTags.length === 0 ? [] : [{ round: index + 1, warTags }];
  });
}

export function orientClanWar(
  war: ClashCurrentWar,
  clanTag: string,
): ClashCurrentWar | null {
  if (war.clan?.tag === clanTag) {
    return war;
  }

  if (war.opponent?.tag === clanTag) {
    return { ...war, clan: war.opponent, opponent: war.clan };
  }

  return null;
}

export function isActiveWarState(state: string): boolean {
  return state === "inWar" || state === "war";
}

/**
 * Prefere a guerra ainda em andamento. Se a rodada mais nova só está em
 * preparação, a anterior ativa continua sendo a guerra do dia.
 */
export function pickCurrentLeagueWar<
  T extends { round: number; state: string },
>(wars: readonly T[]): T | null {
  const ordered = [...wars].sort((left, right) => left.round - right.round);

  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const current = ordered[index];
    if (!current) {
      continue;
    }

    if (!isActiveWarState(current.state) && index > 0) {
      const earlier = ordered[index - 1];
      if (earlier && isActiveWarState(earlier.state)) {
        return earlier;
      }
    }

    return current;
  }

  return null;
}

export function readRoundQuery(
  value: string | string[] | undefined,
): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }

  const round = Number(raw);
  return round >= 1 ? round : null;
}

export function leagueRoundHref(
  basePath: "/guerra" | "/war/map",
  round: number,
  currentRound: number | null,
): string {
  if (currentRound !== null && round === currentRound) {
    return basePath;
  }

  return `${basePath}?rodada=${round}`;
}
