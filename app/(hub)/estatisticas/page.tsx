import { connection } from "next/server";
import { Suspense } from "react";

import { ErrorState } from "@/components/data/error-state";
import { LoadingState } from "@/components/data/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { LeagueStatsBoard } from "@/components/stats/league-stats-board";
import { loadMemberStats } from "@/features/members/load";
import type { MemberStatsSnapshot } from "@/features/members/metrics";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import { ClashRequestError } from "@/services/clash-of-clans/tags";

export const metadata = {
  title: "Estatísticas",
};

export default function StatisticsPage() {
  return (
    <>
      <PageHeader
        title="Estatísticas"
        description="Desempenho na liga de guerra desta temporada e na liga ranqueada semanal."
      />
      <Suspense
        fallback={<LoadingState label="Carregando o desempenho na liga" />}
      >
        <StatsGate />
      </Suspense>
    </>
  );
}

async function StatsGate() {
  await connection();
  let snapshot: MemberStatsSnapshot | null = null;
  let message: string | null = null;

  try {
    snapshot = await loadMemberStats();
  } catch (error) {
    message = publicMessage(error);
  }

  if (!snapshot) {
    return (
      <ErrorState
        title="Não foi possível montar as estatísticas"
        description={
          message ?? "Não foi possível consultar a API do Clash of Clans."
        }
      />
    );
  }

  return (
    <LeagueStatsBoard
      players={snapshot.rankedPlayers}
      tiers={snapshot.rankedTiers}
      roster={snapshot.roster}
      wars={snapshot.wars}
      generatedAt={snapshot.generatedAt}
      notes={snapshot.notes.filter((note) => /liga/i.test(note))}
    />
  );
}

function publicMessage(error: unknown): string {
  if (error instanceof ClashRequestError || error instanceof ClashApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.includes("não está definida")) {
    return error.message;
  }

  return "Não foi possível consultar a API do Clash of Clans.";
}
