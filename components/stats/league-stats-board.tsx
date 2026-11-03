"use client";

import { useMemo, useState } from "react";

import { DataTable, type DataColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import {
  WarLeagueRankings,
  WarLeagueTable,
} from "@/components/members/war-league-view";
import {
  MIN_RANKED_BATTLES,
  MIN_RANKED_DEFENSES,
  RANKED_LEAGUE_NOTES,
  buildRankedLeagueReport,
  rankLeaguePerformance,
  tierName,
  type LeaguePerformanceRow,
  type RankedPlayerHistory,
} from "@/features/members/ranked-league";
import {
  WAR_LEAGUE_NOTES,
  buildWarLeagueReport,
  type ObservedWar,
  type PeriodId,
  type RosterMember,
} from "@/features/members/metrics";

const periods: { id: PeriodId; label: string }[] = [
  { id: "all", label: "Tudo o que há" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "season", label: "Semana mais recente" },
];

export function LeagueStatsBoard({
  players,
  tiers,
  roster,
  wars,
  generatedAt,
  notes,
}: {
  players: RankedPlayerHistory[];
  tiers: Record<string, string>;
  roster: RosterMember[];
  wars: ObservedWar[];
  generatedAt: string;
  notes: string[];
}) {
  const [period, setPeriod] = useState<PeriodId>("all");
  const now = Date.parse(generatedAt);

  const view = useMemo(() => {
    const names = new Map(roster.map((member) => [member.tag, member.name]));
    const report = buildRankedLeagueReport(players, names, {
      period,
      now: Number.isNaN(now) ? 0 : now,
    });
    return { report, performance: rankLeaguePerformance(report.players) };
  }, [now, period, players, roster]);

  const warLeague = useMemo(
    () => buildWarLeagueReport(wars, roster),
    [roster, wars],
  );

  const rows = [...view.performance.rows].sort((left, right) => {
    const leftRate = left.attackRate ?? -1;
    const rightRate = right.attackRate ?? -1;
    return rightRate - leftRate || left.name.localeCompare(right.name, "pt-BR");
  });

  return (
    <div className="flex flex-col gap-8">
      {notes.map((note) => (
        <p
          key={note}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
        >
          {note}
        </p>
      ))}
      <WarLeagueRankings report={warLeague} hiddenByFilter={false} />
      {warLeague.roundsWithRoster > 0 ? (
        <WarLeagueTable report={warLeague} />
      ) : null}

      <SectionHeading
        title="Liga ranqueada"
        description="O período abaixo vale só para as semanas individuais. A liga de guerra fica na temporada que a API liberou."
      />
      <label className="flex w-fit flex-col gap-1 text-xs text-muted-foreground">
        Período
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value as PeriodId)}
          className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
        >
          {periods.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {rows.every((row) => row.weeks === 0) ? (
        <EmptyState
          title="Sem desempenho de liga"
          description="A API não devolveu semanas da liga ranqueada para o elenco neste período."
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <StandingCard
              title="Maior taxa de vitória"
              rows={view.performance.attack}
              format={formatRatio}
              excluded={view.performance.excludedAttack}
              minimum={`Pede pelo menos ${MIN_RANKED_BATTLES} ataques no período.`}
            />
            <StandingCard
              title="Mais estrelas por defesa"
              rows={view.performance.defense}
              format={formatDefense}
              excluded={view.performance.excludedDefense}
              minimum={`Pede pelo menos ${MIN_RANKED_DEFENSES} defesas no período.`}
            />
          </section>
          <section className="flex flex-col gap-3">
            <SectionHeading
              title="Elenco no período"
              description="A taxa de ataque é vitórias dividido pelos ataques oferecidos. A defesa é estrelas dividido pelas defesas."
            />
            <DataTable
              columns={columns(tiers)}
              rows={rows.map((row) => ({ ...row, id: row.tag }))}
              caption="Desempenho na liga ranqueada."
              emptyTitle="Sem semanas"
              emptyDescription="Nenhum membro tem histórico neste período."
            />
          </section>
        </>
      )}
      <details className="rounded-xl border border-border px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">Fórmulas</summary>
        <dl className="mt-3 flex flex-col gap-3">
          {[...WAR_LEAGUE_NOTES, ...RANKED_LEAGUE_NOTES].map((note) => (
            <div key={note.title}>
              <dt className="font-medium">{note.title}</dt>
              <dd className="text-muted-foreground">{note.formula}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function columns(
  tiers: Record<string, string>,
): DataColumn<LeaguePerformanceRow & { id: string }>[] {
  return [
    {
      id: "member",
      header: "Membro",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      id: "weeks",
      header: "Semanas",
      className: "text-right",
      cell: (row) => <span className="tabular-nums">{row.weeks}</span>,
    },
    {
      id: "attack",
      header: "Ataque",
      className: "text-right",
      cell: (row) => (
        <span className="tabular-nums">
          {row.attackRate === null
            ? "—"
            : `${formatRatio(row.attackRate)} · ${row.attackWins}/${row.battles}`}
        </span>
      ),
    },
    {
      id: "defense",
      header: "Defesa",
      className: "text-right",
      cell: (row) => (
        <span className="tabular-nums">
          {row.defenseRate === null ? "—" : formatDefense(row.defenseRate)}
        </span>
      ),
    },
    {
      id: "tier",
      header: "Liga recente",
      cell: (row) =>
        row.tierId === null
          ? "—"
          : (tierName(tiers, row.tierId) ?? "Liga sem nome na API"),
    },
  ];
}

function StandingCard({
  title,
  rows,
  format,
  excluded,
  minimum,
}: {
  title: string;
  rows: { tag: string; name: string; value: number }[];
  format: (value: number) => string;
  excluded: number;
  minimum: string;
}) {
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{minimum}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Ninguém alcançou a amostra mínima neste período.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {rows.slice(0, 10).map((row, index) => (
            <li
              key={row.tag}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span>
                <span className="text-muted-foreground">{index + 1}. </span>
                {row.name}
              </span>
              <span className="tabular-nums">{format(row.value)}</span>
            </li>
          ))}
        </ol>
      )}
      {excluded > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {excluded === 1
            ? "1 membro ficou de fora pela amostra pequena."
            : `${excluded} membros ficaram de fora pela amostra pequena.`}
        </p>
      ) : null}
    </section>
  );
}

function formatRatio(value: number): string {
  return `${(value * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatDefense(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} por defesa`;
}
