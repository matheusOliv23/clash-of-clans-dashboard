import assert from "node:assert/strict";
import test from "node:test";

import {
  MIN_ATTACKS_FOR_RATE,
  MIN_ATTACKS_PER_HALF,
  MIN_OFFERED_ATTACKS,
  buildMemberReport,
  buildWarLeagueReport,
  rankWarLeagueTop,
  warFromParts,
  warsInView,
  type ObservedWar,
  type RosterMember,
  type WarLeaguePlayer,
} from "./metrics.ts";

const NOW = Date.parse("2026-11-03T12:00:00.000Z");

function attack(
  stars: number,
  destruction: number,
  order = 1,
  duration?: number,
) {
  return { stars, destruction, order, duration };
}

function finishedWar(
  partial: Partial<ObservedWar> & Pick<ObservedWar, "endTime">,
): ObservedWar {
  return {
    kind: "regular",
    finished: true,
    opponentTag: "#OPP",
    opponentName: "Rival",
    teamSize: 15,
    attacksPerMember: 2,
    season: null,
    round: null,
    members: [],
    ...partial,
  };
}

const roster: RosterMember[] = [
  { tag: "#AAA", name: "Ana", townHall: 16 },
  { tag: "#BBB", name: "Bia", townHall: 15 },
  { tag: "#CCC", name: "Caio", townHall: 14 },
];

test("guerra em andamento não entra como finalizada", () => {
  const running = warFromParts({
    kind: "league",
    state: "inWar",
    endTime: "20261103T210000.000Z",
    opponentTag: "#OPP",
    opponentName: "Rival",
    teamSize: 15,
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [attack(3, 100)],
      },
    ],
  });

  assert.equal(running?.finished, false);
  const report = buildMemberReport(running ? [running] : [], roster);
  const ana = report.members.find((member) => member.tag === "#AAA");
  assert.equal(ana?.warsParticipated, 0);
  assert.equal(ana?.attacks, 0);
  assert.equal(ana?.averageStars, null);
  assert.equal(report.unfinishedWars, 1);
  assert.equal(report.finishedWarsWithRoster, 0);
});

test("war log sem elenco não inventa ataque individual", () => {
  const logged = warFromParts({
    kind: "regular",
    finishedByEndpoint: true,
    endTime: "20261001T120000.000Z",
    opponentTag: "#LOG",
    opponentName: "Arquivo",
    teamSize: 15,
    attacksPerMember: 2,
    members: null,
  });

  assert.equal(logged?.finished, true);
  assert.equal(logged?.members, null);
  const report = buildMemberReport(logged ? [logged] : [], roster);
  assert.equal(report.finishedWarsWithoutRoster, 1);
  assert.equal(report.finishedWarsWithRoster, 0);
  assert.ok(report.members.every((member) => member.attacks === 0));
  assert.ok(report.members.every((member) => member.averageStars === null));
  assert.equal(report.rankings.stars.length, 0);
});

test("quem ficou de fora da guerra não perde participação", () => {
  const wars = [
    finishedWar({
      endTime: "20261020T120000.000Z",
      attacksPerMember: 2,
      members: [
        {
          tag: "#AAA",
          name: "Ana",
          townHall: 16,
          attacks: [attack(3, 100), attack(2, 80)],
        },
      ],
    }),
    finishedWar({
      endTime: "20261027T120000.000Z",
      opponentTag: "#OUT",
      attacksPerMember: 2,
      members: [
        { tag: "#BBB", name: "Bia", townHall: 15, attacks: [attack(1, 50)] },
      ],
    }),
  ];

  const report = buildMemberReport(wars, roster);
  const ana = report.members.find((member) => member.tag === "#AAA");
  const bia = report.members.find((member) => member.tag === "#BBB");
  assert.equal(ana?.warsParticipated, 1);
  assert.equal(ana?.participationRate, 1);
  assert.equal(bia?.warsParticipated, 1);
  assert.equal(bia?.attacks, 1);
  assert.notEqual(bia?.participationRate, ana?.participationRate);
  assert.ok((bia?.participationRate ?? 1) < 1);
});

test("limite de ataques ausente não vira zero nem cem por cento", () => {
  const war = finishedWar({
    endTime: "20261020T120000.000Z",
    attacksPerMember: null,
    members: [
      { tag: "#AAA", name: "Ana", townHall: 16, attacks: [attack(3, 100)] },
    ],
  });
  const report = buildMemberReport([war], roster);
  const ana = report.members.find((member) => member.tag === "#AAA");
  assert.equal(ana?.offeredAttacks, null);
  assert.equal(ana?.participationRate, null);
  assert.equal(report.rankings.participation.length, 0);
});

test("poucos ataques ficam fora dos rankings de taxa", () => {
  const attacks = Array.from({ length: MIN_ATTACKS_FOR_RATE - 1 }, (_, index) =>
    attack(3, 100, index + 1),
  );
  const war = finishedWar({
    endTime: "20261020T120000.000Z",
    attacksPerMember: MIN_OFFERED_ATTACKS,
    members: [{ tag: "#AAA", name: "Ana", townHall: 16, attacks }],
  });
  const report = buildMemberReport([war], roster);
  const ana = report.members.find((member) => member.tag === "#AAA");
  assert.equal(ana?.averageStars, 3);
  assert.equal(report.rankings.stars.length, 1);
  assert.equal(report.rankings.destruction.length, 0);
  assert.equal(report.rankings.triples.length, 0);
  assert.equal(report.excludedFromRanking.destruction, 1);
});

test("evolução compara metades e recusa amostra curta", () => {
  const early = finishedWar({
    endTime: "20261001T120000.000Z",
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: Array.from({ length: MIN_ATTACKS_PER_HALF }, () =>
          attack(1, 40),
        ),
      },
    ],
  });
  const late = finishedWar({
    endTime: "20261020T120000.000Z",
    opponentTag: "#NEW",
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: Array.from({ length: MIN_ATTACKS_PER_HALF }, () =>
          attack(3, 90),
        ),
      },
    ],
  });
  const grown = buildMemberReport([early, late], roster);
  assert.equal(
    grown.members.find((member) => member.tag === "#AAA")?.evolution,
    50,
  );

  const oneEach = finishedWar({
    endTime: "20261001T120000.000Z",
    opponentTag: "#S1",
    members: [
      { tag: "#BBB", name: "Bia", townHall: 15, attacks: [attack(2, 70)] },
    ],
  });
  const oneEachLater = finishedWar({
    endTime: "20261020T120000.000Z",
    opponentTag: "#S2",
    members: [
      { tag: "#BBB", name: "Bia", townHall: 15, attacks: [attack(3, 100)] },
    ],
  });
  const small = buildMemberReport([oneEach, oneEachLater], roster);
  assert.equal(
    small.members.find((member) => member.tag === "#BBB")?.evolution,
    null,
  );
  assert.equal(
    small.rankings.evolution.some((entry) => entry.tag === "#BBB"),
    false,
  );
});

test("ataque sem destruição informada não vira zero", () => {
  const war = warFromParts({
    kind: "league",
    state: "warEnded",
    endTime: "20261020T120000.000Z",
    opponentTag: "#OPP",
    teamSize: 15,
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [{ stars: 2, order: 1 }],
      },
    ],
  });
  const report = buildMemberReport(war ? [war] : [], roster);
  const ana = report.members.find((member) => member.tag === "#AAA");
  assert.equal(ana?.attacks, 0);
  assert.equal(ana?.warsParticipated, 1);
  assert.equal(ana?.averageDestruction, null);
});

test("filtro de período e de tipo não mistura guerras", () => {
  const wars = [
    finishedWar({
      kind: "regular",
      endTime: "20260801T120000.000Z",
      members: [
        {
          tag: "#AAA",
          name: "Ana",
          townHall: 16,
          attacks: [attack(3, 100), attack(3, 100)],
        },
      ],
    }),
    finishedWar({
      kind: "league",
      endTime: "20261102T120000.000Z",
      season: "2026-11-01",
      members: [
        { tag: "#AAA", name: "Ana", townHall: 16, attacks: [attack(1, 40)] },
      ],
    }),
  ];
  const month = warsInView(wars, {
    kind: "all",
    period: "30d",
    now: NOW,
    seasonStart: Date.parse("2026-11-01T00:00:00.000Z"),
  });
  assert.equal(month.length, 1);
  assert.equal(month[0]?.kind, "league");

  const regular = warsInView(wars, {
    kind: "regular",
    period: "all",
    now: NOW,
    seasonStart: null,
  });
  assert.deepEqual(
    regular.map((war) => war.kind),
    ["regular"],
  );
});

test("liga em andamento conta o ataque feito e não zera quem ainda não atacou", () => {
  const running = warFromParts({
    kind: "league",
    state: "inWar",
    startTime: "20261102T210000.000Z",
    endTime: "20261103T210000.000Z",
    opponentTag: "#OPP",
    opponentName: "Royal Guard",
    teamSize: 15,
    season: "2026-11-01",
    round: 1,
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [attack(3, 98)],
      },
      { tag: "#BBB", name: "Bia", townHall: 15, attacks: [] },
    ],
  });
  const preparing = warFromParts({
    kind: "league",
    state: "preparation",
    endTime: "20261104T210000.000Z",
    opponentTag: "#NEXT",
    opponentName: "TIM FAST",
    teamSize: 15,
    season: "2026-11-01",
    round: 2,
    members: [
      { tag: "#AAA", name: "Ana", townHall: 16, attacks: [] },
      { tag: "#BBB", name: "Bia", townHall: 15, attacks: [] },
    ],
  });

  const report = buildWarLeagueReport(
    [running, preparing].flatMap((war) => (war ? [war] : [])),
    roster,
  );

  assert.equal(report.season, "2026-11-01");
  assert.equal(report.roundsWithRoster, 2);
  assert.equal(report.startedRounds, 1);

  const ana = report.players.find((player) => player.tag === "#AAA");
  const bia = report.players.find((player) => player.tag === "#BBB");
  assert.equal(ana?.attacks, 1);
  assert.equal(ana?.stars, 3);
  assert.equal(ana?.averageDestruction, 98);
  assert.equal(ana?.rounds[0]?.startTime, "20261102T210000.000Z");
  assert.equal(ana?.rounds[1]?.status, "waiting");
  assert.equal(bia?.attacks, 0);
  assert.equal(bia?.averageStars, null);
  assert.equal(bia?.rounds[0]?.status, "pending");
  assert.deepEqual(
    report.rankings.stars.map((entry) => entry.tag),
    ["#AAA", "#BBB"],
  );
  assert.equal(report.rankings.stars[1]?.value, null);
  assert.deepEqual(
    report.rankings.triples.map((entry) => entry.tag),
    ["#AAA", "#BBB"],
  );
});

test("liga encerrada sem ataque não entra como zero na média", () => {
  const ended = warFromParts({
    kind: "league",
    state: "warEnded",
    endTime: "20261102T210000.000Z",
    opponentTag: "#OPP",
    opponentName: "Rival",
    teamSize: 15,
    round: 1,
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [attack(2, 70), attack(1, 40)],
      },
      { tag: "#BBB", name: "Bia", townHall: 15, attacks: [] },
    ],
  });
  const report = buildWarLeagueReport(ended ? [ended] : [], roster);
  const ana = report.players.find((player) => player.tag === "#AAA");
  const bia = report.players.find((player) => player.tag === "#BBB");
  assert.equal(ana?.attacks, 2);
  assert.equal(ana?.stars, 3);
  assert.equal(ana?.averageStars, 1.5);
  assert.equal(ana?.averageDestruction, 55);
  assert.equal(ana?.triples, 0);
  assert.equal(bia?.rounds[0]?.status, "missed");
  assert.equal(bia?.averageDestruction, null);
  assert.equal(report.rankings.destruction[0]?.tag, "#AAA");
  assert.equal(report.rankings.triples[0]?.value, 0);
  assert.equal(report.rankings.triples[1]?.value, null);
  assert.equal(ana?.averageDuration, null);
});

test("tempo de ataque usa a duração enviada e ordena do mais curto", () => {
  const war = warFromParts({
    kind: "league",
    state: "inWar",
    endTime: "20261103T210000.000Z",
    opponentTag: "#OPP",
    opponentName: "Rival",
    teamSize: 15,
    round: 1,
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [attack(3, 100, 1, 90), attack(2, 80, 2)],
      },
      {
        tag: "#BBB",
        name: "Bia",
        townHall: 15,
        attacks: [attack(1, 40, 1, 40)],
      },
      { tag: "#CCC", name: "Caio", townHall: 14, attacks: [] },
    ],
  });
  const report = buildWarLeagueReport(war ? [war] : [], roster);
  const ana = report.players.find((player) => player.tag === "#AAA");
  assert.equal(ana?.averageDuration, 90);
  assert.equal(ana?.rounds[0]?.duration, 90);
  assert.deepEqual(
    report.rankings.duration.map((entry) => [entry.tag, entry.value]),
    [
      ["#BBB", 40],
      ["#AAA", 90],
      ["#CCC", null],
    ],
  );
});

test("top 10 da liga soma as posições e deixa de fora quem não atacou", () => {
  const war = warFromParts({
    kind: "league",
    state: "inWar",
    endTime: "20261103T210000.000Z",
    opponentTag: "#OPP",
    opponentName: "Rival",
    teamSize: 15,
    round: 1,
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [attack(3, 100, 1, 120), attack(3, 100, 2, 120)],
      },
      {
        tag: "#BBB",
        name: "Bia",
        townHall: 15,
        attacks: [attack(3, 99, 1, 40), attack(2, 99, 2, 40)],
      },
      {
        tag: "#CCC",
        name: "Caio",
        townHall: 14,
        attacks: [attack(3, 100, 1, 30), attack(3, 100, 2, 30)],
      },
      { tag: "#DDD", name: "Duda", townHall: 13, attacks: [] },
    ],
  });
  const report = buildWarLeagueReport(war ? [war] : [], [
    ...roster,
    { tag: "#DDD", name: "Duda", townHall: 13 },
  ]);

  assert.deepEqual(
    report.top.map((player) => player.tag),
    ["#CCC", "#AAA", "#BBB"],
  );
  assert.equal(
    report.top.some((player) => player.tag === "#DDD"),
    false,
  );
});

test("top 10 corta em dez e deixa duração ausente por último nesse critério", () => {
  const players: WarLeaguePlayer[] = Array.from({ length: 12 }, (_, index) => ({
    tag: `#P${index}`,
    name: `Jogador ${String(index).padStart(2, "0")}`,
    rounds: [],
    attacks: 1,
    stars: 3,
    averageStars: 3,
    averageDestruction: 100,
    averageDuration: index === 0 ? null : 60,
    triples: 1,
  }));
  const top = rankWarLeagueTop(players);

  assert.equal(top.length, 10);
  assert.equal(
    top.some((player) => player.tag === "#P0"),
    false,
  );
});

test("guerra clássica não entra no desempenho da liga de guerra", () => {
  const classic = finishedWar({
    kind: "regular",
    endTime: "20261101T120000.000Z",
    members: [
      {
        tag: "#AAA",
        name: "Ana",
        townHall: 16,
        attacks: [attack(3, 100)],
      },
    ],
  });
  const report = buildWarLeagueReport([classic], roster);
  assert.equal(report.roundsWithRoster, 0);
  assert.equal(report.players.length, 0);
});
