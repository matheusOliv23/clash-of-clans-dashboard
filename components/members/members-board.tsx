"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import {
  METRIC_NOTES,
  MIN_ATTACKS_FOR_RATE,
  MIN_ATTACKS_PER_HALF,
  WAR_LEAGUE_NOTES,
  buildMemberReport,
  buildWarLeagueReport,
  warsInView,
  type MemberStat,
  type MemberStatsSnapshot,
  type WarLeaguePlayer,
  type PeriodId,
  type RankingId,
  type WarKindFilter,
} from "@/features/members/metrics";
import {
  WarLeagueMemberLines,
  WarLeagueRankings,
  WarLeagueTop,
} from "@/components/members/war-league-view";
const EvolutionChart = dynamic(
  () =>
    import("@/components/members/evolution-chart").then(
      (module) => module.EvolutionChart,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Carregando o gráfico.</p>
    ),
  },
);

const periods: { id: PeriodId; label: string }[] = [
  { id: "all", label: "Tudo o que há" },
  { id: "30d", label: "30 dias" },
  { id: "90d", label: "90 dias" },
  { id: "season", label: "Temporada atual" },
];

const kinds: { id: WarKindFilter; label: string }[] = [
  { id: "all", label: "Todos os tipos" },
  { id: "regular", label: "Guerra clássica" },
  { id: "league", label: "Liga" },
];

const rankingCopy: {
  id: RankingId;
  title: string;
  format: (value: number) => string;
}[] = [
  {
    id: "stars",
    title: "Mais estrelas",
    format: (value) => formatNumber(value, 0),
  },
  {
    id: "destruction",
    title: "Maior destruição",
    format: (value) => formatPoints(value),
  },
  { id: "triples", title: "Maior taxa de triplo", format: formatRatio },
  { id: "participation", title: "Maior participação", format: formatRatio },
  {
    id: "evolution",
    title: "Maior evolução",
    format: (value) =>
      `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pp`,
  },
];

export function MembersBoard({ snapshot }: { snapshot: MemberStatsSnapshot }) {
  const [period, setPeriod] = useState<PeriodId>("all");
  const [kind, setKind] = useState<WarKindFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(
    snapshot.roster[0]?.tag ?? null,
  );

  const seasonStart = snapshot.seasonStart
    ? Date.parse(`${snapshot.seasonStart}T00:00:00.000Z`)
    : null;
  const now = Date.parse(snapshot.generatedAt);

  const visibleWars = useMemo(
    () =>
      warsInView(snapshot.wars, {
        kind,
        period,
        now: Number.isNaN(now) ? 0 : now,
        seasonStart:
          seasonStart !== null && Number.isNaN(seasonStart)
            ? null
            : seasonStart,
      }),
    [kind, now, period, seasonStart, snapshot.wars],
  );

  const report = useMemo(
    () => buildMemberReport(visibleWars, snapshot.roster),
    [snapshot.roster, visibleWars],
  );

  const warLeague = useMemo(
    () => buildWarLeagueReport(visibleWars, snapshot.roster),
    [snapshot.roster, visibleWars],
  );

  const selected =
    report.members.find((member) => member.tag === selectedTag) ??
    report.members[0] ??
    null;

  return (
    <div className="flex flex-col gap-8">
      {snapshot.persistenceError ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {snapshot.persistenceError}
        </p>
      ) : null}
      {snapshot.notes.map((note) => (
        <p
          key={note}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
        >
          {note}
        </p>
      ))}
      {report.unfinishedWars > 0 ? (
        <p className="text-sm text-muted-foreground">
          {report.unfinishedWars === 1
            ? "1 guerra ainda não terminou e fica de fora das médias."
            : `${report.unfinishedWars} guerras ainda não terminaram e ficam de fora das médias.`}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <FilterGroup
          label="Período"
          value={period}
          options={periods}
          onChange={setPeriod}
        />
        <FilterGroup
          label="Tipo de guerra"
          value={kind}
          options={kinds}
          onChange={setKind}
        />
      </div>

      <WarLeagueTop report={warLeague} hiddenByFilter={kind === "regular"} />

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Rankings"
          description={`${report.finishedWarsWithRoster} guerras finalizadas com elenco. Taxas pedem pelo menos ${MIN_ATTACKS_FOR_RATE} ataques; evolução pede ${MIN_ATTACKS_PER_HALF} em cada metade.`}
        />
        {report.finishedWarsWithRoster === 0 ? (
          <EmptyState
            title="Sem guerras finalizadas com elenco"
            description="A API ainda não entregou o roster de uma guerra encerrada neste filtro. A guerra em andamento não entra na conta."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rankingCopy.map((ranking) => (
              <RankingCard
                key={ranking.id}
                title={ranking.title}
                entries={report.rankings[ranking.id]}
                format={ranking.format}
                excluded={
                  ranking.id === "stars"
                    ? 0
                    : report.excludedFromRanking[ranking.id]
                }
              />
            ))}
          </div>
        )}
      </section>

      <WarLeagueRankings
        report={warLeague}
        hiddenByFilter={kind === "regular"}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <SectionHeading title="Elenco" description={`${snapshot.clanName}`} />
          <ul className="flex max-h-[32rem] flex-col gap-1 overflow-y-auto">
            {report.members.map((member) => (
              <li key={member.tag}>
                <button
                  type="button"
                  onClick={() => setSelectedTag(member.tag)}
                  aria-pressed={selected?.tag === member.tag}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                    selected?.tag === member.tag
                      ? "bg-primary/15 text-foreground"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{member.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {member.tag}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {member.townHall > 0 ? `CV ${member.townHall}` : "CV —"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selected ? (
          <MemberProfile
            member={selected}
            warLeague={
              warLeague.players.find((player) => player.tag === selected.tag) ??
              null
            }
          />
        ) : null}
      </section>

      <details className="rounded-xl border border-border px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">Fórmulas</summary>
        <dl className="mt-3 flex flex-col gap-3">
          {[...METRIC_NOTES, ...WAR_LEAGUE_NOTES].map(
            (note) => (
              <div key={note.title}>
                <dt className="font-medium">{note.title}</dt>
                <dd className="text-muted-foreground">{note.formula}</dd>
              </div>
            ),
          )}
        </dl>
      </details>
    </div>
  );
}

function MemberProfile({
  member,
  warLeague,
}: {
  member: MemberStat;
  warLeague: WarLeaguePlayer | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">{member.name}</h2>
        <p className="font-mono text-xs text-muted-foreground">{member.tag}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {member.townHall > 0
            ? `Centro de Vila ${member.townHall}`
            : "Centro de Vila não informado"}
          {member.inClan ? "" : " · fora do elenco atual"}
        </p>
      </div>
      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Evolução de destruição</h3>
        <EvolutionChart points={member.series} />
      </section>
      <WarLeagueMemberLines player={warLeague} />
    </div>
  );
}

function RankingCard({
  title,
  entries,
  format,
  excluded,
}: {
  title: string;
  entries: { tag: string; name: string; value: number }[];
  format: (value: number) => string;
  excluded: number;
}) {
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h3 className="text-sm font-medium">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Ninguém alcançou a amostra mínima neste filtro.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {entries.slice(0, 5).map((entry, index) => (
            <li
              key={entry.tag}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span>
                <span className="text-muted-foreground">{index + 1}. </span>
                {entry.name}
              </span>
              <span className="tabular-nums">{format(entry.value)}</span>
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

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatPoints(value: number): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatRatio(value: number): string {
  return formatPoints(value * 100);
}

function formatNumber(value: number, digits: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
