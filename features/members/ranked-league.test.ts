import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRankedLeagueReport,
  rankLeaguePerformance,
  rankedSeasonFromParts,
  tierName,
} from "./ranked-league.ts";

const NOW = Date.UTC(2026, 10, 3);

function season(
  seasonId: number,
  extras: Partial<{
    trophies: number;
    placement: number;
    attackWins: number;
    attackLosses: number;
    defenseWins: number;
    defenseLosses: number;
    defenseStars: number;
  }> = {},
) {
  const parsed = rankedSeasonFromParts({
    leagueSeasonId: seasonId,
    leagueTrophies: extras.trophies ?? 100,
    leagueTierId: 105000025,
    placement: extras.placement ?? 10,
    attackWins: extras.attackWins ?? 4,
    attackLosses: extras.attackLosses ?? 1,
    attackStars: 0,
    defenseWins: extras.defenseWins ?? 0,
    defenseLosses: extras.defenseLosses ?? 2,
    defenseStars: extras.defenseStars ?? 5,
    maxBattles: 12,
  });
  if (!parsed) {
    throw new Error("temporada inválida");
  }
  return parsed;
}

test("o identificador da semana vira data e campo faltando não vira zero", () => {
  const parsed = rankedSeasonFromParts({
    leagueSeasonId: 1790571600,
    leagueTrophies: 386,
    leagueTierId: 105000025,
    placement: 62,
    attackWins: 12,
    attackLosses: 0,
    attackStars: 0,
    defenseWins: 0,
    defenseLosses: 10,
    defenseStars: 25,
    maxBattles: 12,
  });

  assert.equal(parsed?.startedAt, Date.UTC(2026, 8, 28, 5));
  assert.equal(
    rankedSeasonFromParts({
      leagueSeasonId: 1790571600,
      leagueTrophies: 386,
    }),
    null,
  );
});

test("nome de liga só existe quando a API mandou o nome daquele id", () => {
  assert.equal(
    tierName({ "105000025": "Titan League 25" }, 105000025),
    "Titan League 25",
  );
  assert.equal(tierName({ "105000025": "Titan League 25" }, 105000026), null);
});

test("quem não jogou a semana mais nova não entra com zero", () => {
  const report = buildRankedLeagueReport(
    [
      {
        tag: "#A",
        seasons: [season(200, { trophies: 400, placement: 3, attackWins: 8 })],
      },
      {
        tag: "#B",
        seasons: [season(100, { trophies: 900, placement: 1, attackWins: 12 })],
      },
    ],
    new Map([
      ["#A", "Ana"],
      ["#B", "Bia"],
    ]),
    { period: "all", now: NOW },
  );

  assert.equal(report.weekId, 200);
  assert.deepEqual(
    report.standings.trophies.map((row) => row.tag),
    ["#A"],
  );
  assert.equal(report.missingWeek, 1);
  assert.equal(
    report.players.find((player) => player.tag === "#B")?.trophyChange,
    null,
  );
});

test("colocação premia o menor número e defesa sem amostra fica de fora", () => {
  const report = buildRankedLeagueReport(
    [
      {
        tag: "#A",
        seasons: [
          season(200, {
            placement: 40,
            defenseWins: 0,
            defenseLosses: 0,
            defenseStars: 0,
          }),
        ],
      },
      {
        tag: "#B",
        seasons: [
          season(200, {
            placement: 4,
            defenseLosses: 3,
            defenseStars: 8,
          }),
        ],
      },
    ],
    new Map([
      ["#A", "Ana"],
      ["#B", "Bia"],
    ]),
    { period: "season", now: NOW },
  );

  assert.deepEqual(
    report.standings.placement.map((row) => row.tag),
    ["#B", "#A"],
  );
  assert.deepEqual(
    report.standings.defenseStars.map((row) => row.tag),
    ["#B"],
  );
  assert.equal(report.players[0]?.seasons.length, 1);
});

test("desempenho soma as semanas e recusa amostra curta", () => {
  const short = season(200, {
    attackWins: 3,
    attackLosses: 0,
    defenseWins: 0,
    defenseLosses: 2,
    defenseStars: 6,
  });
  short.maxBattles = 3;

  const steady = season(200, {
    attackWins: 8,
    attackLosses: 4,
    defenseLosses: 4,
    defenseStars: 4,
  });
  const older = season(100, {
    attackWins: 12,
    attackLosses: 0,
    defenseLosses: 4,
    defenseStars: 12,
  });

  const report = buildRankedLeagueReport(
    [
      { tag: "#CURTA", seasons: [short] },
      { tag: "#FIRME", seasons: [steady, older] },
    ],
    new Map([
      ["#CURTA", "Ana"],
      ["#FIRME", "Bia"],
    ]),
    { period: "all", now: NOW },
  );
  const performance = rankLeaguePerformance(report.players);

  assert.deepEqual(
    performance.attack.map((row) => row.tag),
    ["#FIRME"],
  );
  assert.equal(performance.attack[0]?.value, 20 / 24);
  assert.equal(performance.excludedAttack, 1);
  assert.deepEqual(
    performance.defense.map((row) => row.tag),
    ["#FIRME"],
  );
  assert.equal(performance.excludedDefense, 1);
});
