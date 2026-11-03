import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingState } from "@/components/data/loading-state";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { LeagueRoundNav } from "@/components/war/league-round-nav";
import { WarMapBoard } from "@/components/war/war-map-board";
import { readRoundQuery } from "@/features/war/league";
import { loadChosenWar } from "@/features/war/load";
import { presentWarMap } from "@/features/war/map-view";

export const metadata = {
  title: "Mapa de guerra",
};

export default function WarMapPage({
  searchParams,
}: {
  searchParams: Promise<{ rodada?: string | string[] }>;
}) {
  return (
    <>
      <PageHeader
        title="Mapa de guerra"
        description="Bases inimigas da guerra escolhida, na ordem do mapa. A reserva e o planejamento ficam neste navegador."
      />
      <Suspense fallback={<LoadingState label="Carregando o mapa da guerra" />}>
        <MapGate searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MapGate({
  searchParams,
}: {
  searchParams: Promise<{ rodada?: string | string[] }>;
}) {
  await connection();
  const requestedRound = readRoundQuery((await searchParams).rodada);
  const active = await loadChosenWar(requestedRound);

  if (active.status === "error") {
    return (
      <ErrorState
        title="Não foi possível ler o mapa"
        description={active.message}
      />
    );
  }

  if (active.status === "empty") {
    return (
      <>
        <StatusBadge tone={active.stateTone} label={active.stateLabel} />
        <EmptyState title={active.title} description={active.message} />
      </>
    );
  }

  const view = presentWarMap(active.war);
  const selected = active.rounds.find(
    (round) => round.round === active.leagueRound,
  );
  const roundLabel =
    active.leagueRound === null
      ? ""
      : selected?.dayLabel
        ? ` Rodada ${active.leagueRound}, ${selected.dayLabel}`
        : ` Rodada ${active.leagueRound}.`;
  const older =
    active.currentRound !== null &&
    active.leagueRound !== null &&
    active.leagueRound < active.currentRound;

  return (
    <>
      <LeagueRoundNav
        rounds={active.rounds}
        selectedRound={active.leagueRound}
        currentRound={active.currentRound}
        basePath="/war/map"
        unavailableRound={active.unavailableRound}
      />
      {view ? (
        <>
          <SectionHeading
            title={view.opponentName}
            description={`${view.bases.length} bases de ${view.clanName} contra ${view.opponentName}.${roundLabel}${older ? " Rodada anterior desta temporada." : ""}`}
          />
          <WarMapBoard view={view} />
        </>
      ) : (
        <EmptyState
          title="Sem bases inimigas"
          description="A guerra foi encontrada, mas a API não enviou os defensores do adversário."
        />
      )}
    </>
  );
}
