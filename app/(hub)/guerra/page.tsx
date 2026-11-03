import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingState } from "@/components/data/loading-state";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { CurrentWarScreen } from "@/components/war/current-war-screen";
import { DashboardRefresh } from "@/components/war/dashboard-refresh";
import { LeagueRoundNav } from "@/components/war/league-round-nav";
import { leagueRoundHref, readRoundQuery } from "@/features/war/league";
import { loadChosenWar } from "@/features/war/load";
import { getClashPollIntervalMs } from "@/lib/env";
import {
  formatPollInterval,
  listClanAttacks,
  presentCurrentWar,
} from "@/features/war/present";
import { CURRENT_WAR_TTL_MS } from "@/services/clash-of-clans/clans";

export const metadata = {
  title: "Guerra atual",
};

export default function CurrentWarPage({
  searchParams,
}: {
  searchParams: Promise<{ rodada?: string | string[] }>;
}) {
  return (
    <>
      <PageHeader
        title="Guerra atual"
        description="Placar e ataques da guerra. Na liga, dá para abrir os outros dias desta temporada."
      />
      <Suspense fallback={<LoadingState label="Carregando a guerra atual" />}>
        <WarGate searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function WarGate({
  searchParams,
}: {
  searchParams: Promise<{ rodada?: string | string[] }>;
}) {
  await connection();
  const requestedRound = readRoundQuery((await searchParams).rodada);
  const intervalMs = getClashPollIntervalMs();
  const active = await loadChosenWar(requestedRound);
  const cacheSeconds = Math.round(CURRENT_WAR_TTL_MS / 1000);

  return (
    <>
      <DashboardRefresh intervalMs={intervalMs} />
      <p className="text-xs leading-5 text-muted-foreground">
        Atualização automática a cada {formatPollInterval(intervalMs)}. A guerra
        fica em cache por {cacheSeconds}s para não repetir a consulta.
      </p>
      {active.status === "error" ? (
        <ErrorState
          title="Não foi possível ler a guerra"
          description={active.message}
        />
      ) : null}
      {active.status === "empty" ? (
        <>
          <StatusBadge tone={active.stateTone} label={active.stateLabel} />
          <EmptyState title={active.title} description={active.message} />
        </>
      ) : null}
      {active.status === "war" ? (
        <>
          <LeagueRoundNav
            rounds={active.rounds}
            selectedRound={active.leagueRound}
            currentRound={active.currentRound}
            basePath="/guerra"
            unavailableRound={active.unavailableRound}
          />
          <WarBoard active={active} />
        </>
      ) : null}
    </>
  );
}

function WarBoard({
  active,
}: {
  active: Extract<Awaited<ReturnType<typeof loadChosenWar>>, { status: "war" }>;
}) {
  const presented = presentCurrentWar(active.war, new Date(), {
    ...(active.leagueSeason ? { leagueSeason: active.leagueSeason } : {}),
    ...(active.leagueRound !== null ? { leagueRound: active.leagueRound } : {}),
  });

  if (presented.status === "error") {
    return (
      <ErrorState
        title="Não foi possível ler a guerra"
        description={presented.message}
      />
    );
  }

  if (presented.status === "empty") {
    return (
      <EmptyState title={presented.title} description={presented.message} />
    );
  }

  return (
    <CurrentWarScreen
      board={presented.board}
      attacks={listClanAttacks(active.war)}
      mapHref={
        active.leagueRound === null
          ? "/war/map"
          : leagueRoundHref("/war/map", active.leagueRound, active.currentRound)
      }
    />
  );
}
