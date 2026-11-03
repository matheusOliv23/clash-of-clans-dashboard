/**
 * Liga ranqueada individual, vinda de GET /players/{tag}/leaguehistory.
 *
 * Cada item é uma semana. O identificador da temporada é um instante Unix
 * em segundos. Estes números não são ataques da guerra do clã.
 *
 * - Troféus, colocação, vitórias e derrotas: o valor enviado naquela semana.
 * - Evolução de troféus: troféus da semana mais nova menos os da anterior.
 * - Rankings comparam só a semana mais nova que restou no período. Quem não
 *   tem essa semana fica de fora, sem receber zero.
 * - Colocação ordena do menor número para o maior. Colocação ausente ou
 *   menor que 1 fica de fora.
 * - Vitórias de ataque só ranqueiam quem teve pelo menos um ataque na semana.
 * - Estrelas de defesa só ranqueiam quem teve defesa registrada.
 * - Desempenho no período soma as semanas visíveis. A taxa de ataque é
 *   vitórias dividido pelos ataques oferecidos. A taxa de defesa é estrelas
 *   dividido pelas defesas. Abaixo de MIN_RANKED_BATTLES ou
 *   MIN_RANKED_DEFENSES o jogador fica fora do ranking.
 */

export type RankedSeason = {
  seasonId: number;
  startedAt: number | null;
  trophies: number;
  tierId: number;
  placement: number;
  attackWins: number;
  attackLosses: number;
  attackStars: number;
  defenseWins: number;
  defenseLosses: number;
  defenseStars: number;
  maxBattles: number;
};

export type RankedPlayerHistory = {
  tag: string;
  seasons: RankedSeason[];
};

export type RankedLeaguePlayer = {
  tag: string;
  name: string;
  seasons: RankedSeason[];
  latest: RankedSeason | null;
  trophyChange: number | null;
};

export type RankedStanding = {
  tag: string;
  name: string;
  value: number;
};

export type RankedLeagueReport = {
  weekId: number | null;
  weekStart: number | null;
  players: RankedLeaguePlayer[];
  standings: {
    trophies: RankedStanding[];
    attackWins: RankedStanding[];
    placement: RankedStanding[];
    defenseStars: RankedStanding[];
  };
  missingWeek: number;
};

export const MIN_RANKED_BATTLES = 12;
export const MIN_RANKED_DEFENSES = 4;

export type LeaguePerformanceRow = {
  tag: string;
  name: string;
  weeks: number;
  battles: number;
  attackWins: number;
  attackRate: number | null;
  defenses: number;
  defenseStars: number;
  defenseRate: number | null;
  tierId: number | null;
};

export function rankLeaguePerformance(players: readonly RankedLeaguePlayer[]): {
  rows: LeaguePerformanceRow[];
  attack: RankedStanding[];
  defense: RankedStanding[];
  excludedAttack: number;
  excludedDefense: number;
} {
  const rows = players
    .map((player): LeaguePerformanceRow => {
      const battles = player.seasons.reduce(
        (total, season) => total + offeredBattles(season),
        0,
      );
      const attackWins = player.seasons.reduce(
        (total, season) => total + season.attackWins,
        0,
      );
      const defenses = player.seasons.reduce(
        (total, season) => total + season.defenseWins + season.defenseLosses,
        0,
      );
      const defenseStars = player.seasons.reduce(
        (total, season) => total + season.defenseStars,
        0,
      );

      return {
        tag: player.tag,
        name: player.name,
        weeks: player.seasons.length,
        battles,
        attackWins,
        attackRate: battles > 0 ? attackWins / battles : null,
        defenses,
        defenseStars,
        defenseRate: defenses > 0 ? defenseStars / defenses : null,
        tierId: player.latest?.tierId ?? null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  return {
    rows,
    attack: rank(
      rows.flatMap((row) =>
        row.attackRate !== null && row.battles >= MIN_RANKED_BATTLES
          ? [{ tag: row.tag, name: row.name, value: row.attackRate }]
          : [],
      ),
      "desc",
    ),
    defense: rank(
      rows.flatMap((row) =>
        row.defenseRate !== null && row.defenses >= MIN_RANKED_DEFENSES
          ? [{ tag: row.tag, name: row.name, value: row.defenseRate }]
          : [],
      ),
      "desc",
    ),
    excludedAttack: rows.filter(
      (row) => row.battles > 0 && row.battles < MIN_RANKED_BATTLES,
    ).length,
    excludedDefense: rows.filter(
      (row) => row.defenses > 0 && row.defenses < MIN_RANKED_DEFENSES,
    ).length,
  };
}

function offeredBattles(season: RankedSeason): number {
  if (season.maxBattles > 0) {
    return season.maxBattles;
  }

  return season.attackWins + season.attackLosses;
}

export const RANKED_LEAGUE_NOTES: { title: string; formula: string }[] = [
  {
    title: "Liga ranqueada",
    formula:
      "Semanas devolvidas por /players/{tag}/leaguehistory. Cada semana traz troféus, liga, colocação, ataques e defesas. Isso não entra na média das guerras do clã.",
  },
  {
    title: "Evolução de troféus",
    formula:
      "Troféus da semana mais recente menos os da semana anterior, dentro do período escolhido.",
  },
  {
    title: "Rankings da semana",
    formula:
      "Comparam apenas a semana mais nova do filtro. Quem não jogou essa semana fica de fora. A colocação premia o menor número.",
  },
  {
    title: "Desempenho no período",
    formula: `Soma as semanas do filtro. Taxa de ataque = vitórias / ataques oferecidos, com pelo menos ${MIN_RANKED_BATTLES} ataques. Taxa de defesa = estrelas / defesas, com pelo menos ${MIN_RANKED_DEFENSES} defesas. Amostra menor fica de fora.`,
  },
];

type IncomingSeason = {
  leagueSeasonId?: unknown;
  leagueTrophies?: unknown;
  leagueTierId?: unknown;
  placement?: unknown;
  attackWins?: unknown;
  attackLosses?: unknown;
  attackStars?: unknown;
  defenseWins?: unknown;
  defenseLosses?: unknown;
  defenseStars?: unknown;
  maxBattles?: unknown;
};

export function rankedSeasonFromParts(
  input: IncomingSeason,
): RankedSeason | null {
  const seasonId = finiteNumber(input.leagueSeasonId);
  const trophies = finiteNumber(input.leagueTrophies);
  const tierId = finiteNumber(input.leagueTierId);
  const placement = finiteNumber(input.placement);
  const attackWins = finiteNumber(input.attackWins);
  const attackLosses = finiteNumber(input.attackLosses);
  const attackStars = finiteNumber(input.attackStars);
  const defenseWins = finiteNumber(input.defenseWins);
  const defenseLosses = finiteNumber(input.defenseLosses);
  const defenseStars = finiteNumber(input.defenseStars);
  const maxBattles = finiteNumber(input.maxBattles);

  if (
    seasonId === null ||
    trophies === null ||
    tierId === null ||
    placement === null ||
    attackWins === null ||
    attackLosses === null ||
    attackStars === null ||
    defenseWins === null ||
    defenseLosses === null ||
    defenseStars === null ||
    maxBattles === null
  ) {
    return null;
  }

  return {
    seasonId,
    startedAt: seasonInstant(seasonId),
    trophies,
    tierId,
    placement,
    attackWins,
    attackLosses,
    attackStars,
    defenseWins,
    defenseLosses,
    defenseStars,
    maxBattles,
  };
}

export function tierName(
  tiers: Readonly<Record<string, string>>,
  tierId: number,
): string | null {
  const name = tiers[String(tierId)];
  return name && name.trim() ? name : null;
}

export function buildRankedLeagueReport(
  histories: readonly RankedPlayerHistory[],
  names: ReadonlyMap<string, string>,
  filter: { period: "all" | "30d" | "90d" | "season"; now: number },
): RankedLeagueReport {
  const currentWeekId = histories.reduce<number | null>((newest, history) => {
    for (const season of history.seasons) {
      if (newest === null || season.seasonId > newest) {
        newest = season.seasonId;
      }
    }
    return newest;
  }, null);

  const players = histories
    .map((history) => {
      const seasons = history.seasons
        .filter((season) =>
          filter.period === "season"
            ? season.seasonId === currentWeekId
            : seasonInPeriod(season, filter),
        )
        .sort((left, right) => right.seasonId - left.seasonId);
      const latest = seasons[0] ?? null;
      const previous = seasons[1] ?? null;
      return {
        tag: history.tag,
        name: names.get(history.tag) ?? history.tag,
        seasons,
        latest,
        trophyChange:
          latest && previous ? latest.trophies - previous.trophies : null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  const weekId =
    players.reduce<number | null>((newest, player) => {
      const seasonId = player.latest?.seasonId ?? null;
      if (seasonId === null) {
        return newest;
      }
      return newest === null || seasonId > newest ? seasonId : newest;
    }, null) ?? null;

  const week = players.flatMap((player) => {
    const season = player.seasons.find((item) => item.seasonId === weekId);
    return season ? [{ player, season }] : [];
  });

  return {
    weekId,
    weekStart:
      week.find((entry) => entry.season.startedAt !== null)?.season.startedAt ??
      null,
    players,
    standings: {
      trophies: rank(
        week.map((entry) => ({
          tag: entry.player.tag,
          name: entry.player.name,
          value: entry.season.trophies,
        })),
        "desc",
      ),
      attackWins: rank(
        week.flatMap((entry) =>
          entry.season.attackWins + entry.season.attackLosses > 0
            ? [
                {
                  tag: entry.player.tag,
                  name: entry.player.name,
                  value: entry.season.attackWins,
                },
              ]
            : [],
        ),
        "desc",
      ),
      placement: rank(
        week.flatMap((entry) =>
          entry.season.placement >= 1
            ? [
                {
                  tag: entry.player.tag,
                  name: entry.player.name,
                  value: entry.season.placement,
                },
              ]
            : [],
        ),
        "asc",
      ),
      defenseStars: rank(
        week.flatMap((entry) =>
          entry.season.defenseWins + entry.season.defenseLosses > 0
            ? [
                {
                  tag: entry.player.tag,
                  name: entry.player.name,
                  value: entry.season.defenseStars,
                },
              ]
            : [],
        ),
        "desc",
      ),
    },
    missingWeek: players.filter(
      (player) =>
        player.seasons.length > 0 &&
        !player.seasons.some((season) => season.seasonId === weekId),
    ).length,
  };
}

function seasonInPeriod(
  season: RankedSeason,
  filter: { period: "all" | "30d" | "90d" | "season"; now: number },
): boolean {
  if (filter.period === "all") {
    return true;
  }

  if (season.startedAt === null) {
    return false;
  }

  const days = filter.period === "30d" ? 30 : 90;
  return season.startedAt >= filter.now - days * 24 * 60 * 60 * 1000;
}

function rank(
  rows: RankedStanding[],
  direction: "asc" | "desc",
): RankedStanding[] {
  return [...rows].sort((left, right) => {
    const delta =
      direction === "asc" ? left.value - right.value : right.value - left.value;
    return delta || left.name.localeCompare(right.name, "pt-BR");
  });
}

function seasonInstant(seasonId: number): number | null {
  if (!Number.isFinite(seasonId) || seasonId <= 0) {
    return null;
  }

  const millis = seasonId >= 1_000_000_000_000 ? seasonId : seasonId * 1000;
  if (millis < Date.UTC(2010, 0, 1) || millis > Date.UTC(2100, 0, 1)) {
    return null;
  }

  return millis;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
