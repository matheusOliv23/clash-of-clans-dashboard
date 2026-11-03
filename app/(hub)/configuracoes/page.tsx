import { connection } from "next/server";
import { Suspense } from "react";

import { LoadingState } from "@/components/data/loading-state";
import { MockNotice } from "@/components/data/mock-notice";
import { StatusBadge } from "@/components/data/status-badge";
import { PageHeader, SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClanSetupStatus } from "@/features/clan/config";
import { mockClan } from "@/features/war/mock";

export const metadata = {
  title: "Configurações",
};

const setupItems = [
  ["Tag do clã", "clanTagConfigured"],
  ["Chave da API", "apiKeyConfigured"],
  ["PostgreSQL", "databaseConfigured"],
] as const;

const queries = [
  { href: "/api/clash/clan", label: "Informações do clã" },
  { href: "/api/clash/members", label: "Membros" },
  { href: "/api/clash/current-war", label: "Guerra atual" },
  { href: "/api/clash/warlog", label: "Histórico de guerras" },
] as const;

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Identidade placeholder do clã e o que o servidor já consegue ler, sem expor segredos."
      />
      <MockNotice />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeading
            title="Clã exibido"
            description="Nome e tag fixos desta etapa. A sincronização ainda não os substitui."
          />
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Nome</dt>
              <dd className="mt-1 font-medium">{mockClan.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Tag</dt>
              <dd className="mt-1 font-mono">{mockClan.tag}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Nível</dt>
              <dd className="mt-1 tabular-nums">{mockClan.level}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeading
            title="Ambiente do servidor"
            description="O painel só informa se a variável existe. O valor permanece no servidor."
          />
          <Suspense
            fallback={
              <LoadingState
                variant="compact"
                label="Lendo configuração do servidor"
              />
            }
          >
            <ServerSetup />
          </Suspense>
          <Button variant="outline" asChild className="w-fit">
            <a
              href="https://developer.clashofclans.com/"
              target="_blank"
              rel="noreferrer"
            >
              Abrir portal da Supercell
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeading
            title="Consultas da API"
            description="Rotas do servidor. A chave não sai do backend. O painel continua com dados de demonstração."
          />
          <ul className="divide-y divide-border">
            {queries.map((query) => (
              <li key={query.href} className="py-3">
                <a
                  href={query.href}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {query.label}
                </a>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {query.href}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

async function ServerSetup() {
  await connection();
  const status = getClanSetupStatus();

  return (
    <ul className="divide-y divide-border">
      {setupItems.map(([label, key]) => {
        const configured = status[key];

        return (
          <li
            key={key}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="text-sm">{label}</span>
            <StatusBadge
              tone={configured ? "concluido" : "pendente"}
              label={configured ? "Definida" : "Pendente"}
            />
          </li>
        );
      })}
    </ul>
  );
}
