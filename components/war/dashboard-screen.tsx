import Link from "next/link";
import { Clock, Star, Swords, Target, Users } from "lucide-react";

import { DataTable, type DataColumn } from "@/components/data/data-table";
import { Meter } from "@/components/data/meter";
import { StarScore } from "@/components/data/star-score";
import { StatCard } from "@/components/data/stat-card";
import { StatusBadge } from "@/components/data/status-badge";
import { SectionHeading } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { formatAttackDuration } from "@/features/war/map-view";
import {
  formatCount,
  formatPercent,
  type WarAttackRow,
  type WarBoard,
  type WarParticipant,
} from "@/features/war/present";

const participantColumns: DataColumn<WarParticipant>[] = [
  {
    id: "member",
    header: "Membro",
    cell: (member) => (
      <span className="flex flex-col">
        <span className="font-medium">{member.name}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {member.tag}
        </span>
      </span>
    ),
  },
  {
    id: "townHall",
    header: "CV",
    className: "text-right",
    cell: (member) => <span className="tabular-nums">{member.townHall}</span>,
  },
  {
    id: "used",
    header: "Usados",
    className: "text-right",
    cell: (member) => (
      <span className="tabular-nums">{member.attacksUsed}</span>
    ),
  },
  {
    id: "remaining",
    header: "Restantes",
    className: "text-right",
    cell: (member) => (
      <span className="tabular-nums">
        {formatCount(member.attacksRemaining)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (member) => (
      <StatusBadge
        tone={
          member.attacksRemaining === null
            ? "nao-sincronizado"
            : member.attacksRemaining > 0
              ? "pendente"
              : "concluido"
        }
        label={
          member.attacksRemaining === null
            ? "Sem limite"
            : member.attacksRemaining > 0
              ? "Pendente"
              : "Concluído"
        }
      />
    ),
  },
];

export function DashboardScreen({ board }: { board: WarBoard }) {
  const starMax = board.maxStars ?? 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Estrelas conquistadas"
          value={starValue(board.clanStars, board.maxStars)}
          detail={
            board.opponentStars === null
              ? "A API não enviou as estrelas do adversário."
              : `Adversário: ${formatCount(board.opponentStars)} estrelas.`
          }
          icon={Star}
        />
        <StatCard
          label="Destruição"
          value={
            board.clanDestruction === null
              ? "—"
              : formatPercent(board.clanDestruction)
          }
          detail={
            board.opponentDestruction === null
              ? "A API não enviou a destruição do adversário."
              : `Adversário: ${formatPercent(board.opponentDestruction)}.`
          }
          icon={Target}
        />
        <StatCard
          label="Ataques pendentes"
          value={formatCount(
            board.attacksRemaining ??
              (board.participants.length === 0 ? null : board.pending.length),
          )}
          detail={attackDetail(board)}
          icon={Swords}
        />
        <StatCard
          label="Membros participantes"
          value={
            board.teamSize === null
              ? formatCount(board.participants.length)
              : `${board.participants.length}/${board.teamSize}`
          }
          detail={
            board.teamSize === null
              ? "A API não enviou o tamanho da guerra."
              : `Guerra ${board.teamSize}x${board.teamSize}.`
          }
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading
                title="Progresso da guerra"
                description={progressDescription(board)}
              />
              <StatusBadge tone={board.stateTone} label={board.stateLabel} />
            </div>
            {board.clanStars !== null && starMax > 0 ? (
              <Meter
                label={board.clanName}
                value={board.clanStars}
                max={starMax}
                display={`${formatCount(board.clanStars)} estrelas · ${
                  board.clanDestruction === null
                    ? "—"
                    : formatPercent(board.clanDestruction)
                }`}
              />
            ) : null}
            {board.opponentStars !== null && starMax > 0 ? (
              <Meter
                label={board.opponentName}
                value={board.opponentStars}
                max={starMax}
                display={`${formatCount(board.opponentStars)} estrelas · ${
                  board.opponentDestruction === null
                    ? "—"
                    : formatPercent(board.opponentDestruction)
                }`}
                tone="muted"
              />
            ) : null}
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 text-primary" aria-hidden />
              {board.timeValue
                ? `${board.timeCaption}: ${board.timeValue}`
                : board.timeCaption}
            </p>
            <Link
              href="/guerra"
              className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Abrir guerra atual
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-4">
            <SectionHeading
              title="Ataques recentes"
              description="Os últimos ataques do clã, pela ordem enviada pela API."
            />
            {board.recentAttacks.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Nenhum ataque registrado nesta guerra.
              </p>
            ) : (
              <ol className="flex flex-col">
                {board.recentAttacks.map((attack) => (
                  <AttackItem key={attack.id} attack={attack} />
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Membros com ataques pendentes"
          description={
            board.attacksPerMember === null
              ? "A API não informa o limite por membro nesta guerra. A lista mostra quem não tem ataque registrado."
              : "Quem ainda não usou todos os ataques desta guerra."
          }
        />
        <DataTable
          columns={participantColumns}
          rows={board.pending}
          caption="Membros que ainda têm ataques disponíveis."
          emptyTitle="Nenhum ataque pendente"
          emptyDescription={
            board.attacksPerMember === null
              ? "Todos os participantes já têm um ataque registrado."
              : "Todos os participantes já usaram os ataques disponíveis."
          }
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Membros participantes"
          description="Elenco do clã nesta guerra, com ataques usados e restantes."
        />
        <DataTable
          columns={participantColumns}
          rows={board.participants}
          caption="Membros do clã participantes da guerra atual."
          emptyTitle="Nenhum participante"
          emptyDescription="A API não enviou a lista de membros desta guerra."
        />
      </section>
    </>
  );
}

function AttackItem({ attack }: { attack: WarAttackRow }) {
  const target =
    attack.base === null
      ? attack.defender
      : `base ${attack.base} · ${attack.defender}`;

  return (
    <li className="border-b border-border/80 py-3 last:border-0">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          Ataque {attack.order}
        </span>
        <span className="text-sm leading-5">
          {attack.attacker} em {target}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <StarScore value={attack.stars} />
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatPercent(attack.destruction)} ·{" "}
            {formatAttackDuration(attack.duration)}
          </span>
        </span>
      </div>
    </li>
  );
}

function starValue(stars: number | null, max: number | null): string {
  if (stars === null) {
    return "—";
  }
  if (max === null) {
    return formatCount(stars);
  }
  return `${formatCount(stars)}/${formatCount(max)}`;
}

function progressDescription(board: WarBoard): string {
  const match = `${board.clanName} contra ${board.opponentName}.`;
  if (board.leagueSeason && board.leagueRound !== null) {
    return `${match} Temporada ${board.leagueSeason}, rodada ${board.leagueRound}.`;
  }

  return match;
}

function attackDetail(board: WarBoard): string {
  if (board.attacksUsed !== null && board.maxAttacks !== null) {
    return `${formatCount(board.attacksUsed)} de ${formatCount(board.maxAttacks)} ataques já usados.`;
  }

  if (board.attacksUsed !== null) {
    return `${formatCount(board.attacksUsed)} ataques registrados. ${formatCount(board.pending.length)} membros ainda sem ataque.`;
  }

  return "A API não enviou os ataques desta guerra.";
}
