import { connection } from "next/server";
import { Suspense } from "react";

import { ErrorState } from "@/components/data/error-state";
import { LoadingState } from "@/components/data/loading-state";
import { MembersBoard } from "@/components/members/members-board";
import { PageHeader } from "@/components/layout/page-header";
import { loadMemberStats } from "@/features/members/load";
import type { MemberStatsSnapshot } from "@/features/members/metrics";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import { ClashRequestError } from "@/services/clash-of-clans/tags";

export const metadata = {
  title: "Membros da Guerra",
};

export default function WarMembersPage() {
  return (
    <>
      <PageHeader
        title="Membros da Guerra"
        description="O Top 10 da liga vem primeiro, com estrelas, destruição, triplos e tempo de ataque nas rodadas que a API já liberou."
      />
      <Suspense
        fallback={<LoadingState label="Carregando o desempenho dos membros" />}
      >
        <WarMembersGate />
      </Suspense>
    </>
  );
}

async function WarMembersGate() {
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

  return <MembersBoard snapshot={snapshot} />;
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
