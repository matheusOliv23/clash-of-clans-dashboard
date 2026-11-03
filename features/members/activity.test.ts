import assert from "node:assert/strict";
import test from "node:test";

import { buildClanRoster } from "./activity.ts";
import type { RankedPlayerHistory } from "./ranked-league.ts";
import type { ObservedWar, RosterMember } from "./metrics.ts";

const WEEK = Date.parse("2026-10-26T05:00:00.000Z");
const OLDER = Date.parse("2026-10-12T05:00:00.000Z");

function member(
  partial: Partial<RosterMember> & Pick<RosterMember, "tag" | "name">,
): RosterMember {
  return {
    townHall: 15,
    role: "member",
    trophies: 100,
    leagueName: "Titan League 25",
    donations: 0,
    donationsReceived: 0,
    clanRank: 1,
    ...partial,
  };
}

function history(
  tag: string,
  seasons: Array<{ seasonId: number; startedAt: number; trophies?: number }>,
): RankedPlayerHistory {
  return {
    tag,
    seasons: seasons.map((season) => ({
      seasonId: season.seasonId,
      startedAt: season.startedAt,
      trophies: season.trophies ?? 100,
      tierId: 1,
      placement: 10,
      attackWins: 1,
      attackLosses: 0,
      attackStars: 0,
      defenseWins: 0,
      defenseLosses: 0,
      defenseStars: 0,
      maxBattles: 12,
    })),
  };
}

function leagueWar(tags: Array<{ tag: string; attacks: number }>): ObservedWar {
  return {
    kind: "league",
    finished: false,
    endTime: "20261103T210000.000Z",
    opponentTag: "#OPP",
    opponentName: "Rival",
    teamSize: 15,
    attacksPerMember: null,
    season: "2026-11-01",
    round: 1,
    members: tags.map((entry) => ({
      tag: entry.tag,
      name: entry.tag,
      townHall: 15,
      attacks: Array.from({ length: entry.attacks }, () => ({
        stars: 3,
        destruction: 100,
        order: 1,
      })),
    })),
  };
}

test("doação, ataque na liga ou semana ranqueada marcam o membro como ativo", () => {
  const rows = buildClanRoster(
    [
      member({ tag: "#DON", name: "Dora", donations: 20 }),
      member({ tag: "#WAR", name: "Wagner", donations: 0 }),
      member({ tag: "#RANK", name: "Rita", donations: 0, trophies: 0 }),
    ],
    [
      history("#DON", [{ seasonId: 1, startedAt: OLDER }]),
      history("#RANK", [{ seasonId: 2, startedAt: WEEK, trophies: 350 }]),
      history("#WAR", [{ seasonId: 1, startedAt: OLDER }]),
    ],
    [leagueWar([{ tag: "#WAR", attacks: 1 }])],
  );

  const byTag = new Map(rows.map((row) => [row.tag, row]));
  assert.equal(byTag.get("#DON")?.status, "active");
  assert.match(byTag.get("#DON")?.detail ?? "", /Doou no contador atual/);
  assert.equal(byTag.get("#WAR")?.status, "active");
  assert.match(byTag.get("#WAR")?.detail ?? "", /Atacou na liga de guerra/);
  assert.equal(byTag.get("#RANK")?.status, "active");
  assert.match(byTag.get("#RANK")?.detail ?? "", /26 de out/);
});

test("sem doação, sem ataque e fora da semana mais nova fica inativo", () => {
  const rows = buildClanRoster(
    [member({ tag: "#QUIET", name: "Quico", donations: 0 })],
    [
      history("#QUIET", [{ seasonId: 1, startedAt: OLDER }]),
      history("#OTHER", [{ seasonId: 2, startedAt: WEEK }]),
    ],
    [
      leagueWar([
        { tag: "#OTHER", attacks: 1 },
        { tag: "#QUIET", attacks: 0 },
      ]),
    ],
  );

  assert.equal(rows[0]?.status, "quiet");
  assert.match(rows[0]?.detail ?? "", /Inativo/);
  assert.match(rows[0]?.detail ?? "", /não informa o último login/);
  assert.match(rows[0]?.detail ?? "", /12 de out/);
});

test("guerra clássica não conta como atividade da liga", () => {
  const classic: ObservedWar = {
    ...leagueWar([{ tag: "#AAA", attacks: 1 }]),
    kind: "regular",
  };
  const rows = buildClanRoster(
    [member({ tag: "#AAA", name: "Ana", donations: 0 })],
    [],
    [classic],
  );
  assert.equal(rows[0]?.status, "quiet");
  assert.doesNotMatch(rows[0]?.detail ?? "", /Atacou na liga/);
});

test("ordena por cargo e, no mesmo cargo, pelo centro de vila mais alto", () => {
  const rows = buildClanRoster(
    [
      member({ tag: "#M15", name: "Mario", role: "member", townHall: 15 }),
      member({ tag: "#L12", name: "Lia", role: "leader", townHall: 12 }),
      member({ tag: "#M16", name: "Mara", role: "member", townHall: 16 }),
      member({ tag: "#C14", name: "Caio", role: "coLeader", townHall: 14 }),
      member({ tag: "#A11", name: "Ana", role: "admin", townHall: 11 }),
    ],
    [],
    [],
  );

  assert.deepEqual(
    rows.map((row) => row.tag),
    ["#L12", "#C14", "#A11", "#M16", "#M15"],
  );
});

test("sem doações, sem ranqueada e sem elenco não chama o membro de inativo", () => {
  const rows = buildClanRoster(
    [member({ tag: "#AAA", name: "Ana", donations: undefined })],
    [],
    [],
  );
  assert.equal(rows[0]?.status, "unknown");
  assert.match(rows[0]?.detail ?? "", /não informa o último login/);
});
