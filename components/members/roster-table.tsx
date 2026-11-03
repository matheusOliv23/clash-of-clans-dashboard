"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import type { RosterRow, RosterStatus } from "@/features/members/activity";

type StatusFilter = "all" | "active" | "quiet";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Ativos" },
  { id: "quiet", label: "Inativos" },
];

export function RosterTable({ rows }: { rows: RosterRow[] }) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const quiet = rows.filter((row) => row.status === "quiet").length;
  const active = rows.filter((row) => row.status === "active").length;
  const visible =
    filter === "all" ? rows : rows.filter((row) => row.status === filter);
  const tableRows = visible.map((row) => ({ ...row, id: row.tag }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {rows.length === 1 ? "1 membro" : `${rows.length} membros`}
          {quiet > 0
            ? ` · ${quiet === 1 ? "1 inativo" : `${quiet} inativos`}`
            : ""}
          {active > 0
            ? ` · ${active === 1 ? "1 ativo" : `${active} ativos`}`
            : ""}
        </p>
        <label className="flex w-fit flex-col gap-1 text-xs text-muted-foreground">
          Situação
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as StatusFilter)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
          >
            {statusFilters.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length === 0 ? (
        <DataTable
          columns={columns}
          rows={tableRows}
          caption="Membros do clã e sinais recentes de atividade."
          emptyTitle="Sem membros"
          emptyDescription="A API não devolveu o elenco do clã nesta leitura."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === "active" ? "Nenhum ativo" : "Nenhum inativo"}
          description={
            filter === "active"
              ? "Nenhum membro teve doação, ataque na liga de guerra ou presença na semana mais nova da liga ranqueada."
              : "Todos os membros desta leitura têm algum sinal recente."
          }
        />
      ) : (
        <div className="@container">
          <ul className="flex flex-col @min-[36rem]:hidden">
            {visible.map((row) => (
              <li key={row.tag} className="border-b py-3">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-medium">{row.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {row.tag}
                    </span>
                  </span>
                  <StatusLabel status={row.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {row.roleLabel}
                  {" · CV "}
                  {row.townHall > 0 ? row.townHall : "—"}
                </p>
                <p className="mt-1 text-sm break-words text-muted-foreground">
                  {row.detail}
                </p>
              </li>
            ))}
          </ul>
          <div className="hidden @min-[36rem]:block">
            <DataTable
              className="table-fixed"
              columns={columns}
              rows={tableRows}
              caption="Membros do clã e sinais recentes de atividade."
              emptyTitle="Sem membros"
              emptyDescription="A API não devolveu o elenco do clã nesta leitura."
            />
          </div>
        </div>
      )}
    </div>
  );
}

const columns: DataColumn<RosterRow & { id: string }>[] = [
  {
    id: "member",
    header: "Membro",
    className: "w-[7rem] whitespace-normal align-top",
    cell: (row) => (
      <span className="block">
        <span className="font-medium">{row.name}</span>
        <span className="block font-mono text-xs text-muted-foreground">
          {row.tag}
        </span>
      </span>
    ),
  },
  {
    id: "role",
    header: "Cargo",
    className: "w-[4.5rem] whitespace-normal align-top",
    cell: (row) => row.roleLabel,
  },
  {
    id: "hall",
    header: "CV",
    className: "w-[2.5rem] whitespace-nowrap text-right align-top",
    cell: (row) => (
      <span className="tabular-nums">
        {row.townHall > 0 ? row.townHall : "—"}
      </span>
    ),
  },
  {
    id: "status",
    header: "Situação",
    className: "w-[5.5rem] whitespace-normal align-top",
    cell: (row) => <StatusLabel status={row.status} />,
  },
  {
    id: "detail",
    header: "Leitura",
    className: "whitespace-normal break-words align-top",
    cell: (row) => (
      <span className="block break-words text-muted-foreground">
        {row.detail}
      </span>
    ),
  },
];

function StatusLabel({ status }: { status: RosterStatus }) {
  const label =
    status === "active"
      ? "Ativo"
      : status === "quiet"
        ? "Inativo"
        : "Sem leitura";
  const flagClass =
    status === "active"
      ? "fill-emerald-500 text-emerald-400"
      : status === "quiet"
        ? "fill-red-500 text-red-400"
        : "text-muted-foreground";

  return (
    <span className="flex items-start gap-2 font-medium">
      <Flag className={`mt-0.5 size-4 shrink-0 ${flagClass}`} aria-hidden />
      <span className="min-w-0">{label}</span>
    </span>
  );
}
