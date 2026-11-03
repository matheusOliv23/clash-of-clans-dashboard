import assert from "node:assert/strict";
import test from "node:test";

import {
  leagueRoundHref,
  pickCurrentLeagueWar,
  readRoundQuery,
} from "./league.ts";

test("a guerra em andamento prevalece sobre a preparação do dia seguinte", () => {
  const picked = pickCurrentLeagueWar([
    { round: 1, state: "warEnded" },
    { round: 2, state: "inWar" },
    { round: 3, state: "preparation" },
  ]);

  assert.equal(picked?.round, 2);
});

test("a rodada mais nova entra quando nenhuma anterior segue ativa", () => {
  const picked = pickCurrentLeagueWar([
    { round: 1, state: "warEnded" },
    { round: 2, state: "preparation" },
  ]);

  assert.equal(picked?.round, 2);
});

test("a consulta da rodada ignora texto e zero", () => {
  assert.equal(readRoundQuery("2"), 2);
  assert.equal(readRoundQuery(["4", "1"]), 4);
  assert.equal(readRoundQuery("0"), null);
  assert.equal(readRoundQuery("ontem"), null);
});

test("o link da rodada atual fica sem filtro", () => {
  assert.equal(leagueRoundHref("/guerra", 2, 2), "/guerra");
  assert.equal(leagueRoundHref("/war/map", 1, 2), "/war/map?rodada=1");
});
