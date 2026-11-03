import Link from "next/link";

import { leagueRoundHref } from "@/features/war/league";
import type { LeagueRoundSummary } from "@/features/war/load";
import { cn } from "@/lib/utils";

export function LeagueRoundNav({
  rounds,
  selectedRound,
  currentRound,
  basePath,
  unavailableRound,
}: {
  rounds: LeagueRoundSummary[];
  selectedRound: number | null;
  currentRound: number | null;
  basePath: "/guerra" | "/war/map";
  unavailableRound: number | null;
}) {
  if (rounds.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Guerras da liga nesta temporada"
      className="flex flex-col gap-2"
    >
      <p className="text-xs leading-5 text-muted-foreground">
        Rodadas desta temporada que a API já liberou. Cada dia é uma guerra.
        Temporadas anteriores não ficam nessa resposta.
      </p>
      {unavailableRound !== null ? (
        <p className="text-sm text-amber-100">
          A rodada {unavailableRound} ainda não foi liberada. A guerra exibida é
          a disponível agora.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {rounds.map((round) => {
          const selected = round.round === selectedRound;
          const current = round.round === currentRound;

          return (
            <Link
              key={round.round}
              href={leagueRoundHref(basePath, round.round, currentRound)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-w-36 flex-col rounded-lg border px-3 py-2 text-sm",
                selected
                  ? "border-primary bg-primary/15"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <span className="font-medium">
                Rodada {round.round}
                {current ? " · atual" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                {round.dayLabel ? `${round.dayLabel} · ` : ""}
                {round.opponentName} · {round.stateLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
