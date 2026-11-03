"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { StarScore } from "@/components/data/star-score";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/features/war/present";
import {
  formatAttackDuration,
  type WarMapAttack,
  type WarMapBase,
  type WarMapView,
} from "@/features/war/map-view";
import { cn } from "@/lib/utils";

type FilterId = "all" | "open" | "tripled" | "recoverable";
type SortId = "position" | "townHall" | "destruction";
type AttackState = "open" | "hit" | "tripled";

type Plan = {
  reserved: boolean;
  note: string;
};

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todas as bases" },
  { id: "open", label: "Não atacadas" },
  { id: "tripled", label: "3 estrelas" },
  { id: "recoverable", label: "Ainda recuperáveis" },
];

const sorts: { id: SortId; label: string }[] = [
  { id: "position", label: "Número da base" },
  { id: "townHall", label: "Centro de Vila" },
  { id: "destruction", label: "Menor destruição" },
];

export function WarMapBoard({ view }: { view: WarMapView }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("position");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const plans = useSyncExternalStore(
    subscribePlans,
    () => readPlans(view.warKey),
    emptyPlans,
  );

  const bases = useMemo(() => {
    const visible = view.bases.filter((base) => matchesFilter(base, filter));
    return visible.sort((left, right) => compareBases(left, right, sort));
  }, [filter, sort, view.bases]);

  const selected = view.bases.find((base) => base.tag === selectedTag) ?? null;
  const selectedPlan = selected ? planFor(plans, selected.tag) : null;

  function updatePlan(tag: string, next: Plan) {
    writePlans(view.warKey, { ...plans, [tag]: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
          {filters.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? "default" : "outline"}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Ordenar por
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortId)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
          >
            {sorts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend swatch="border-border bg-card" label="Não atacada" />
        <Legend swatch="border-amber-400/60 bg-amber-400/10" label="Atacada" />
        <Legend swatch="border-primary bg-primary/15" label="3 estrelas" />
        <Legend swatch="border-sky-400 bg-sky-400/10" label="Reservada" />
      </ul>
      <p className="text-xs leading-5 text-muted-foreground">
        A duração e a ordem vêm da API. O horário de relógio de cada ataque não
        é enviado.
      </p>

      {bases.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma base neste filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {bases.map((base) => {
            const plan = planFor(plans, base.tag);
            const state = attackState(base);
            return (
              <button
                key={base.tag}
                id={base.id}
                type="button"
                onClick={() => setSelectedTag(base.tag)}
                className={cn(
                  "scroll-mt-24 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40",
                  cardClass(state, plan.reserved),
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Base {base.position}</p>
                    <p className="text-xs text-muted-foreground">
                      CV {base.townHall}
                    </p>
                  </div>
                  {base.stars === null ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <StarScore value={base.stars} />
                  )}
                </div>
                <p className="mt-3 font-medium">{base.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {base.tag}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="tabular-nums">
                    {base.destruction === null
                      ? "Destruição não informada"
                      : formatPercent(base.destruction)}
                  </span>
                  <StatusText state={state} reserved={plan.reserved} />
                </div>
                {base.attacks.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1 border-t border-border/80 pt-2">
                    {base.attacks.map((attack) => (
                      <li
                        key={`${attack.attackerTag}-${attack.order}`}
                        className="text-xs leading-5 text-muted-foreground"
                      >
                        <span className="text-foreground">
                          {attack.attackerName}
                        </span>
                        {" · "}
                        <span className="tabular-nums">
                          {formatAttackDuration(attack.duration)}
                        </span>
                        {` · ordem ${attack.order}`}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTag(null);
          }
        }}
      >
        {selected && selectedPlan ? (
          <BaseDialog
            base={selected}
            plan={selectedPlan}
            onPlan={(next) => updatePlan(selected.tag, next)}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

function BaseDialog({
  base,
  plan,
  onPlan,
}: {
  base: WarMapBase;
  plan: Plan;
  onPlan: (plan: Plan) => void;
}) {
  const state = attackState(base);

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Base {base.position} · CV {base.townHall}
        </DialogTitle>
        <DialogDescription>
          {base.name} · {base.tag}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {base.stars === null ? (
            <span className="text-sm text-muted-foreground">
              Estrelas não informadas
            </span>
          ) : (
            <StarScore value={base.stars} />
          )}
          <span className="text-sm tabular-nums">
            {base.destruction === null
              ? "Destruição não informada"
              : formatPercent(base.destruction)}
          </span>
          <StatusText state={state} reserved={plan.reserved} />
        </div>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Ataques registrados</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            Duração e ordem vêm da API. O horário de relógio não é enviado.
          </p>
          {base.attacks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {base.attackCount > 0
                ? `A API registrou ${base.attackCount} ${base.attackCount === 1 ? "ataque" : "ataques"} neste alvo, sem o detalhe de cada um.`
                : "Nenhum ataque registrado neste alvo."}
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {base.attacks.map((attack) => (
                <AttackRow
                  key={`${attack.attackerTag}-${attack.order}`}
                  attack={attack}
                />
              ))}
            </ol>
          )}
        </section>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={plan.reserved ? "default" : "outline"}
            onClick={() => onPlan({ ...plan, reserved: !plan.reserved })}
          >
            {plan.reserved ? "Liberar reserva" : "Reservar alvo"}
          </Button>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          Planejamento do próximo ataque
          <textarea
            value={plan.note}
            maxLength={500}
            rows={4}
            onChange={(event) => onPlan({ ...plan, note: event.target.value })}
            placeholder="Quem ataca, por qual lado, o que priorizar. Fica só neste navegador."
            className="resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>
    </DialogContent>
  );
}

function AttackRow({ attack }: { attack: WarMapAttack }) {
  return (
    <li className="flex flex-col gap-1 py-2 text-sm">
      <span className="font-medium">{attack.attackerName}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {attack.attackerTag}
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <StarScore value={attack.stars} />
        <span className="tabular-nums text-muted-foreground">
          {formatPercent(attack.destruction)} ·{" "}
          {formatAttackDuration(attack.duration)} · ataque {attack.order}
        </span>
      </span>
    </li>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("size-3 rounded-sm border", swatch)} aria-hidden />
      {label}
    </li>
  );
}

function StatusText({
  state,
  reserved,
}: {
  state: AttackState;
  reserved: boolean;
}) {
  const label =
    state === "tripled"
      ? "3 estrelas"
      : state === "hit"
        ? "Atacada"
        : "Não atacada";

  return (
    <span>
      {label}
      {reserved ? " · Reservada" : ""}
    </span>
  );
}

function attackState(base: WarMapBase): AttackState {
  if (base.stars === 3) {
    return "tripled";
  }
  if (base.attackCount > 0 || base.attacks.length > 0) {
    return "hit";
  }
  return "open";
}

function matchesFilter(base: WarMapBase, filter: FilterId): boolean {
  const state = attackState(base);
  if (filter === "open") {
    return state === "open";
  }
  if (filter === "tripled") {
    return state === "tripled";
  }
  if (filter === "recoverable") {
    return state === "hit";
  }
  return true;
}

function compareBases(
  left: WarMapBase,
  right: WarMapBase,
  sort: SortId,
): number {
  if (sort === "townHall") {
    return right.townHall - left.townHall || left.position - right.position;
  }
  if (sort === "destruction") {
    return (
      (left.destruction ?? -1) - (right.destruction ?? -1) ||
      left.position - right.position
    );
  }
  return left.position - right.position;
}

function cardClass(state: AttackState, reserved: boolean): string {
  const tone =
    state === "tripled"
      ? "border-primary bg-primary/10"
      : state === "hit"
        ? "border-amber-400/60 bg-amber-400/10"
        : "border-border bg-card";

  return reserved ? `${tone} ring-2 ring-sky-400` : tone;
}

const emptyPlans = () => EMPTY_PLANS;

const planCache = new Map<string, Record<string, Plan>>();
const planListeners = new Set<() => void>();

function subscribePlans(onStoreChange: () => void) {
  planListeners.add(onStoreChange);
  return () => {
    planListeners.delete(onStoreChange);
  };
}

function planFor(plans: Record<string, Plan>, tag: string): Plan {
  return plans[tag] ?? { reserved: false, note: "" };
}

function readPlans(warKey: string): Record<string, Plan> {
  const cached = planCache.get(warKey);
  if (cached) {
    return cached;
  }

  const plans = loadPlans(warKey);
  planCache.set(warKey, plans);
  return plans;
}

function writePlans(warKey: string, plans: Record<string, Plan>) {
  const kept = Object.fromEntries(
    Object.entries(plans).filter(([, plan]) => plan.reserved || plan.note),
  );
  planCache.set(warKey, kept);
  window.localStorage.setItem(storageKey(warKey), JSON.stringify(kept));
  for (const listener of planListeners) {
    listener();
  }
}

function loadPlans(warKey: string): Record<string, Plan> {
  try {
    const raw = window.localStorage.getItem(storageKey(warKey));
    if (!raw) {
      return EMPTY_PLANS;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return EMPTY_PLANS;
    }
    return parsed as Record<string, Plan>;
  } catch {
    return EMPTY_PLANS;
  }
}

const EMPTY_PLANS: Record<string, Plan> = {};

function storageKey(warKey: string): string {
  return `clanhub:war-map:${warKey}`;
}
