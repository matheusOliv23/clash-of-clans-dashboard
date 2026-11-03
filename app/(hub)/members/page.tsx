import { connection } from "next/server";
import { Suspense } from "react";

import { ErrorState } from "@/components/data/error-state";
import { LoadingState } from "@/components/data/loading-state";
import { PageHeader } from "@/components/layout/page-header";
import { RosterTable } from "@/components/members/roster-table";
import { buildClanRoster } from "@/features/members/activity";
import { loadMemberStats } from "@/features/members/load";
import type { MemberStatsSnapshot } from "@/features/members/metrics";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import { ClashRequestError } from "@/services/clash-of-clans/tags";

export const metadata = {
  title: "Membros",
};

export default function MembersPage() {
  return (
    <>
      <PageHeader
        title="Membros"
        description="Elenco do clã. Ativo significa doação no contador atual, ataque na liga de guerra desta temporada ou presença na semana mais nova da liga ranqueada. A API não informa o último login."
      />
      <Suspense fallback={<LoadingState label="Carregando o elenco" />}>
        <MembersGate />
      </Suspense>
    </>
  );
}

async function MembersGate() {
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
        title="Não foi possível montar o elenco"
        description={
          message ?? "Não foi possível consultar a API do Clash of Clans."
        }
      />
    );
  }

  return (
    <RosterTable
      rows={buildClanRoster(
        snapshot.roster,
        snapshot.rankedPlayers,
        snapshot.wars,
      )}
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
