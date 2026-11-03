import Link from "next/link";

import { DataTable, type DataColumn } from "@/components/data/data-table";
import { Meter } from "@/components/data/meter";
import { StarScore } from "@/components/data/star-score";
import { StatusBadge } from "@/components/data/status-badge";
import { SectionHeading } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatAttackDuration } from "@/features/war/map-view";
import {
  formatCount,
  formatPercent,
  type WarAttackRow,
  type WarBoard,
} from "@/features/war/present";

function attackColumns(mapHref: string): DataColumn<WarAttackRow>[] {
  return [
    {
      id: "order",
      header: "Ordem",
      cell: (attack) => <span className="tabular-nums">{attack.order}</span>,
    },
    {
      id: "attacker",
      header: "Atacante",
      cell: (attack) => (
        <span className="flex flex-col">
          <span className="font-medium">{attack.attacker}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {attack.attackerTag}
          </span>
        </span>
      ),
    },
    {
      id: "base",
      header: "Base",
      cell: (attack) =>
        attack.base === null ? (
          attack.defender
        ) : (
          <Link
            href={`${mapHref}#base-${attack.base}`}
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            {attack.base} · {attack.defender}
          </Link>
        ),
    },
    {
      id: "stars",
      header: "Estrelas",
      cell: (attack) => <StarScore value={attack.stars} />,
    },
    {
      id: "destruction",
      header: "Destruição",
      className: "text-right",
      cell: (attack) => (
        <span className="tabular-nums">
          {formatPercent(attack.destruction)}
        </span>
      ),
    },
    {
      id: "duration",
      header: "Duração",
      className: "text-right",
      cell: (attack) => (
        <span className="tabular-nums">
          {formatAttackDuration(attack.duration)}
        </span>
      ),
    },
  ];
}

export function CurrentWarScreen({
  board,
  attacks,
  mapHref,
}: {
  board: WarBoard;
  attacks: WarAttackRow[];
  mapHref: string;
}) {
  const starMax = board.maxStars ?? 0;
  const match = `${board.clanName} contra ${board.opponentName}.`;
  const league =
    board.leagueSeason && board.leagueRound !== null
      ? ` Temporada ${board.leagueSeason}, rodada ${board.leagueRound}.`
      : "";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge tone={board.stateTone} label={board.stateLabel} />
        <p className="text-sm text-muted-foreground">
          {board.timeValue
            ? `${board.timeCaption}: ${board.timeValue}`
            : board.timeCaption}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {match}
        {league}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <SectionHeading
              title={board.clanName}
              description={board.clanTag}
            />
            {board.clanStars !== null && starMax > 0 ? (
              <Meter
                label="Estrelas"
                value={board.clanStars}
                max={starMax}
                display={`${formatCount(board.clanStars)}/${formatCount(starMax)}`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                A API não enviou as estrelas do clã.
              </p>
            )}
            <DestructionLine value={board.clanDestruction} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-4">
            <SectionHeading
              title={board.opponentName}
              description="Adversário desta guerra"
            />
            {board.opponentStars !== null && starMax > 0 ? (
              <Meter
                label="Estrelas"
                value={board.opponentStars}
                max={starMax}
                display={`${formatCount(board.opponentStars)}/${formatCount(starMax)}`}
                tone="muted"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                A API não enviou as estrelas do adversário.
              </p>
            )}
            <DestructionLine value={board.opponentDestruction} />
          </CardContent>
        </Card>
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            title="Registro de ataques"
            description="Ataques do clã, da ordem mais recente para a mais antiga. A duração vem da API. O horário de relógio de cada ataque fica de fora dessa resposta."
          />
          <Link
            href={mapHref}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Abrir mapa de guerra
          </Link>
        </div>
        <DataTable
          columns={attackColumns(mapHref)}
          rows={attacks}
          caption="Ataques do clã na guerra atual."
          emptyTitle="Nenhum ataque registrado"
          emptyDescription="Esta guerra ainda não tem ataques do clã na resposta da API."
        />
      </section>
    </>
  );
}

function DestructionLine({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <p className="text-sm text-muted-foreground">Destruição: não informada</p>
    );
  }

  return (
    <Meter
      label="Destruição"
      value={value}
      max={100}
      display={formatPercent(value)}
      tone="danger"
    />
  );
}
