import { connection } from "next/server";
import { Suspense } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { ErrorState } from "@/components/data/error-state";
import { LoadingState } from "@/components/data/loading-state";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardRefresh } from "@/components/war/dashboard-refresh";
import { DashboardScreen } from "@/components/war/dashboard-screen";
import { getClashPollIntervalMs } from "@/lib/env";
import { loadDashboard } from "@/features/war/load";
import { formatPollInterval } from "@/features/war/present";
import { CURRENT_WAR_TTL_MS } from "@/services/clash-of-clans/clans";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Placar da guerra atual ou da rodada da liga, ataques que ainda faltam e tempo restante."
      />
      <Suspense fallback={<LoadingState label="Carregando a guerra atual" />}>
        <DashboardGate />
      </Suspense>
    </>
  );
}

async function DashboardGate() {
  await connection();
  const intervalMs = getClashPollIntervalMs();
  const result = await loadDashboard();
  const cacheSeconds = Math.round(CURRENT_WAR_TTL_MS / 1000);

  return (
    <>
      <DashboardRefresh intervalMs={intervalMs} />
      <p className="text-xs leading-5 text-muted-foreground">
        Atualização automática a cada {formatPollInterval(intervalMs)}. A guerra
        fica em cache por {cacheSeconds}s para não repetir a consulta.
      </p>
      {result.status === "error" ? (
        <ErrorState
          title="Não foi possível ler a guerra"
          description={`${result.message} A próxima leitura automática tenta de novo.`}
        />
      ) : null}
      {result.status === "empty" ? (
        <>
          <StatusBadge tone={result.stateTone} label={result.stateLabel} />
          <EmptyState title={result.title} description={result.message} />
        </>
      ) : null}
      {result.status === "board" ? (
        <DashboardScreen board={result.board} />
      ) : null}
    </>
  );
}
