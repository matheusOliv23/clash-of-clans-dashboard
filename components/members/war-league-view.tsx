import { DataTable, type DataColumn } from "@/components/data/data-table";
import { EmptyState } from "@/components/data/empty-state";
import { SectionHeading } from "@/components/layout/page-header";
import {
  parseClashInstant,
  type WarLeaguePlayer,
  type WarLeagueRank,
  type WarLeagueReport,
  type WarLeagueRoundLine,
} from "@/features/members/metrics";
import { formatAttackDuration } from "@/features/war/map-view";

const LEAGUE_LIST_LIMIT = 15;

export function WarLeagueTop({
  report,
  hiddenByFilter,
}: {
  report: WarLeagueReport;
  hiddenByFilter: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="Top 10 da liga"
        description="Até agora, nas rodadas com elenco que a API já liberou. A ordem soma a posição em estrelas, destruição, triplos e tempo de ataque. Mais estrelas, mais destruição e mais triplos sobem; o tempo menor também. Quem ainda não atacou fica de fora."
      />
      {hiddenByFilter ? (
        <p className="text-sm text-muted-foreground">
          Este filtro mostra só a guerra clássica. O Top 10 da liga aparece em
          Todos os tipos ou em Liga.
        </p>
      ) : report.roundsWithRoster === 0 ? (
        <EmptyState
          title="Sem rodadas da liga de guerra"
          description="A API ainda não entregou o elenco de uma rodada desta temporada. Temporadas passadas não vêm nesse endpoint."
        />
      ) : report.top.length === 0 ? (
        <EmptyState
          title="Ninguém atacou ainda"
          description="O elenco já está na liga, mas nenhum ataque entrou na conta até agora."
        />
      ) : (
        <DataTable
          columns={topColumns}
          rows={report.top.map((player, index) => ({
            ...player,
            id: player.tag,
            place: index + 1,
          }))}
          caption="Top 10 da liga de guerra até o momento."
          emptyTitle="Sem ataques na liga"
          emptyDescription="Nenhum ataque entrou na conta até agora."
        />
      )}
    </section>
  );
}

export function WarLeagueRankings({
  report,
  hiddenByFilter,
}: {
  report: WarLeagueReport;
  hiddenByFilter: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="Liga de guerra"
        description={leagueDescription(report, hiddenByFilter)}
      />
      {hiddenByFilter ? null : report.roundsWithRoster === 0 ? (
        <EmptyState
          title="Sem rodadas da liga de guerra"
          description="A API ainda não entregou o elenco de uma rodada desta temporada neste filtro. Temporadas passadas não vêm nesse endpoint."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LeagueRankCard
            title="Mais estrelas"
            rows={report.rankings.stars}
            format={(value) => starsLabel(value)}
          />
          <LeagueRankCard
            title="Maior destruição"
            rows={report.rankings.destruction}
            format={formatPoints}
          />
          <LeagueRankCard
            title="Mais triplos"
            rows={report.rankings.triples}
            format={(value) => formatNumber(value, 0)}
          />
          <LeagueRankCard
            title="Tempo de ataque"
            hint="Média dos ataques, do mais curto ao mais longo."
            rows={report.rankings.duration}
            format={(value) => formatAttackDuration(Math.round(value))}
          />
        </div>
      )}
    </section>
  );
}

export function WarLeagueMemberLines({
  player,
}: {
  player: WarLeaguePlayer | null;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">Liga de guerra</h3>
      {player === null ? (
        <p className="text-sm text-muted-foreground">
          Este membro não está nas rodadas da liga de guerra que a API já
          liberou neste filtro.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {player.attacks === 0
              ? "Nenhum ataque registrado nas rodadas em que estava no elenco."
              : `${countLabel(player.attacks, "ataque", "ataques")} · ${starsLabel(player.averageStars ?? 0)} em média · ${formatPoints(player.averageDestruction ?? 0)} de destruição · ${countLabel(player.triples, "triplo", "triplos")}${player.averageDuration === null ? "" : ` · ${formatAttackDuration(Math.round(player.averageDuration))}`}`}
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {player.rounds.map((round) => (
              <li key={round.key} className="flex flex-col gap-1 py-2 text-sm">
                <span className="font-medium">{roundTitle(round)}</span>
                <span className="text-muted-foreground">
                  {roundDetail(round)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function WarLeagueTable({ report }: { report: WarLeagueReport }) {
  const rows = [...report.players]
    .sort(
      (left, right) =>
        right.stars - left.stars ||
        left.name.localeCompare(right.name, "pt-BR"),
    )
    .map((player) => ({ ...player, id: player.tag }));

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption="Desempenho na liga de guerra desta temporada."
      emptyTitle="Sem elenco de liga"
      emptyDescription="A API não devolveu membros nas rodadas já liberadas."
    />
  );
}

const topColumns: DataColumn<
  WarLeaguePlayer & { id: string; place: number }
>[] = [
  {
    id: "place",
    header: "#",
    className: "w-10",
    cell: (row) => <span className="tabular-nums">{row.place}</span>,
  },
  {
    id: "member",
    header: "Membro",
    className: "whitespace-normal",
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: "stars",
    header: "Estrelas",
    className: "text-right",
    cell: (row) => (
      <span className="tabular-nums">{formatNumber(row.stars, 0)}</span>
    ),
  },
  {
    id: "destruction",
    header: "Destruição",
    className: "text-right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.averageDestruction === null
          ? "—"
          : formatPoints(row.averageDestruction)}
      </span>
    ),
  },
  {
    id: "triples",
    header: "Triplos",
    className: "text-right",
    cell: (row) => <span className="tabular-nums">{row.triples}</span>,
  },
  {
    id: "duration",
    header: "Tempo",
    className: "text-right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.averageDuration === null
          ? "—"
          : formatAttackDuration(Math.round(row.averageDuration))}
      </span>
    ),
  },
];

const columns: DataColumn<WarLeaguePlayer & { id: string }>[] = [
  {
    id: "member",
    header: "Membro",
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    id: "attacks",
    header: "Ataques",
    className: "text-right",
    cell: (row) => <span className="tabular-nums">{row.attacks}</span>,
  },
  {
    id: "stars",
    header: "Estrelas",
    className: "text-right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.attacks === 0 ? "—" : formatNumber(row.stars, 0)}
      </span>
    ),
  },
  {
    id: "destruction",
    header: "Destruição",
    className: "text-right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.averageDestruction === null
          ? "—"
          : formatPoints(row.averageDestruction)}
      </span>
    ),
  },
  {
    id: "triples",
    header: "Triplos",
    className: "text-right",
    cell: (row) => <span className="tabular-nums">{row.triples}</span>,
  },
  {
    id: "duration",
    header: "Tempo",
    className: "text-right",
    cell: (row) => (
      <span className="tabular-nums">
        {row.averageDuration === null
          ? "—"
          : formatAttackDuration(Math.round(row.averageDuration))}
      </span>
    ),
  },
];

function LeagueRankCard({
  title,
  hint,
  rows,
  format,
}: {
  title: string;
  hint?: string;
  rows: WarLeagueRank[];
  format: (value: number) => string;
}) {
  const listed = rows.slice(0, LEAGUE_LIST_LIMIT);

  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h3 className="text-sm font-medium">{title}</h3>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {listed.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum membro no elenco destas rodadas.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {listed.map((entry, index) => (
            <li
              key={entry.tag}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span>
                <span className="text-muted-foreground">{index + 1}. </span>
                {entry.name}
              </span>
              <span className="text-right tabular-nums">
                {entry.value === null ? "—" : format(entry.value)}
                <span className="ml-2 text-xs text-muted-foreground">
                  {countLabel(entry.attacks, "ataque", "ataques")}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function leagueDescription(
  report: WarLeagueReport,
  hiddenByFilter: boolean,
): string {
  if (hiddenByFilter) {
    return "Este filtro mostra só a guerra clássica. A liga de guerra aparece em Todos os tipos ou em Liga.";
  }

  if (report.roundsWithRoster === 0) {
    return "Rodadas do grupo atual com elenco. Temporadas passadas não vêm na API.";
  }

  const season = formatSeason(report.season);
  return `${season}. ${report.roundsWithRoster === 1 ? "1 rodada com elenco" : `${report.roundsWithRoster} rodadas com elenco`}, ${report.startedRounds === 1 ? "1 já com ataques ou encerrada" : `${report.startedRounds} já com ataques ou encerradas`}. Quem ainda não atacou numa guerra aberta não entra como zero.`;
}

function roundTitle(line: WarLeagueRoundLine): string {
  const round = line.round === null ? "Rodada" : `Rodada ${line.round}`;
  const when = formatRoundWhen(line.startTime ?? line.endTime);
  return when
    ? `${round} · ${line.opponentName} · ${when}`
    : `${round} · ${line.opponentName}`;
}

function roundDetail(line: WarLeagueRoundLine): string {
  if (line.status === "waiting") {
    return "A guerra ainda não começou.";
  }
  if (line.status === "pending") {
    return "Ainda não atacou.";
  }
  if (
    line.status === "missed" ||
    line.stars === null ||
    line.destruction === null
  ) {
    return "Não atacou.";
  }
  const time =
    line.duration === null
      ? ""
      : ` · ${formatAttackDuration(Math.round(line.duration))}`;
  if (line.attacks === 1) {
    return `${starsLabel(line.stars)} · ${formatPoints(line.destruction)} de destruição${time}`;
  }
  return `${countLabel(line.attacks, "ataque", "ataques")} · ${starsLabel(line.stars)} · ${formatPoints(line.destruction)} de destruição${time}`;
}

function formatSeason(season: string | null): string {
  if (!season) {
    return "Temporada atual";
  }

  const match = /^(\d{4})-(\d{2})/.exec(season);
  const year = match?.[1];
  const month = match?.[2];
  if (!year || !month) {
    return `Temporada ${season}`;
  }

  const label = new Date(
    Date.UTC(Number(year), Number(month) - 1, 1),
  ).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Temporada de ${label}`;
}

function formatRoundWhen(endTime: string): string {
  const instant = parseClashInstant(endTime);
  if (instant === null) {
    return "";
  }

  return new Date(instant).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function starsLabel(stars: number): string {
  const shown = Number.isInteger(stars)
    ? formatNumber(stars, 0)
    : formatNumber(stars, 1);
  return `${shown} ${stars === 1 ? "estrela" : "estrelas"}`;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatPoints(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatNumber(value: number, digits: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
