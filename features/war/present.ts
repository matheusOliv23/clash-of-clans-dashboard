import type { ClashCurrentWar, ClashWarState } from "@/types/clash-of-clans";

export type DashboardTone =
  "em-guerra" | "preparacao" | "concluido" | "nao-sincronizado";

export type WarParticipant = {
  id: string;
  name: string;
  tag: string;
  townHall: number;
  attacksUsed: number;
  attacksRemaining: number | null;
};

export type WarAttackRow = {
  id: string;
  order: number;
  attacker: string;
  attackerTag: string;
  defender: string;
  defenderTag: string;
  base: number | null;
  stars: number;
  destruction: number;
  duration: number;
};

export type WarBoard = {
  clanName: string;
  clanTag: string;
  opponentName: string;
  teamSize: number | null;
  stateLabel: string;
  stateTone: DashboardTone;
  timeCaption: string;
  timeValue: string | null;
  clanStars: number | null;
  opponentStars: number | null;
  maxStars: number | null;
  clanDestruction: number | null;
  opponentDestruction: number | null;
  attacksUsed: number | null;
  attacksRemaining: number | null;
  maxAttacks: number | null;
  attacksPerMember: number | null;
  leagueSeason: string | null;
  leagueRound: number | null;
  participants: WarParticipant[];
  pending: WarParticipant[];
  recentAttacks: WarAttackRow[];
};

export type DashboardResult =
  | { status: "board"; board: WarBoard }
  | {
      status: "empty";
      stateLabel: string;
      stateTone: DashboardTone;
      title: string;
      message: string;
    }
  | { status: "error"; message: string };

const CLASH_TIME = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/;

const BOARD_STATES = new Set<ClashWarState>([
  "preparation",
  "matched",
  "enterWar",
  "war",
  "inWar",
  "ended",
  "warEnded",
]);

export function presentCurrentWar(
  war: ClashCurrentWar,
  now: Date,
  context?: { leagueSeason?: string; leagueRound?: number },
): DashboardResult {
  const state = war.state;

  if (!BOARD_STATES.has(state)) {
    return emptyResult(state);
  }

  const attacksPerMember = numberOrNull(war.attacksPerMember);
  const teamSize = numberOrNull(war.teamSize);
  const participants = (war.clan?.members ?? [])
    .slice()
    .sort((left, right) => left.mapPosition - right.mapPosition)
    .map((member) => toParticipant(member, attacksPerMember));

  const pending = participants.filter((member) =>
    attacksPerMember === null
      ? member.attacksUsed === 0
      : (member.attacksRemaining ?? 0) > 0,
  );

  const attacksUsed = war.clan?.members
    ? participants.reduce((total, member) => total + member.attacksUsed, 0)
    : null;
  const attacksRemaining =
    attacksPerMember === null || attacksUsed === null
      ? null
      : participants.reduce(
          (total, member) => total + (member.attacksRemaining ?? 0),
          0,
        );
  const maxAttacks =
    teamSize !== null && attacksPerMember !== null
      ? teamSize * attacksPerMember
      : null;
  const maxStars = teamSize === null ? null : teamSize * 3;
  const time = describeTime(war, now.getTime());

  return {
    status: "board",
    board: {
      clanName: textOrFallback(war.clan?.name),
      clanTag: textOrFallback(war.clan?.tag),
      opponentName: textOrFallback(war.opponent?.name),
      teamSize,
      stateLabel: context?.leagueSeason
        ? `Liga · ${stateLabel(state)}`
        : stateLabel(state),
      stateTone: stateTone(state),
      timeCaption: time.caption,
      timeValue: time.value,
      clanStars: numberOrNull(war.clan?.stars),
      opponentStars: numberOrNull(war.opponent?.stars),
      maxStars,
      clanDestruction: numberOrNull(war.clan?.destructionPercentage),
      opponentDestruction: numberOrNull(war.opponent?.destructionPercentage),
      attacksUsed,
      attacksRemaining,
      maxAttacks,
      attacksPerMember,
      leagueSeason: context?.leagueSeason ?? null,
      leagueRound: context?.leagueRound ?? null,
      participants,
      pending,
      recentAttacks: recentAttacks(war),
    },
  };
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatCount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR");
}

export function formatPollInterval(intervalMs: number): string {
  if (intervalMs % 60_000 === 0) {
    const minutes = intervalMs / 60_000;
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  }

  const seconds = Math.round(intervalMs / 1000);
  return `${seconds} segundos`;
}

export function clanInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (!first) {
    return "?";
  }
  if (!second) {
    return first.slice(0, 2).toUpperCase();
  }
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

function toParticipant(
  member: NonNullable<NonNullable<ClashCurrentWar["clan"]>["members"]>[number],
  attacksPerMember: number | null,
): WarParticipant {
  const attacksUsed = member.attacks?.length ?? 0;

  return {
    id: `m-${member.tag.replace("#", "")}`,
    name: member.name,
    tag: member.tag,
    townHall: member.townhallLevel,
    attacksUsed,
    attacksRemaining:
      attacksPerMember === null
        ? null
        : Math.max(0, attacksPerMember - attacksUsed),
  };
}

export function listClanAttacks(war: ClashCurrentWar): WarAttackRow[] {
  const allies = new Map(
    (war.clan?.members ?? []).map((member) => [member.tag, member.name]),
  );
  const opponents = new Map(
    (war.opponent?.members ?? []).map((member) => [
      member.tag,
      { name: member.name, base: member.mapPosition },
    ]),
  );
  const rows: WarAttackRow[] = [];

  for (const member of war.clan?.members ?? []) {
    for (const attack of member.attacks ?? []) {
      const defender = opponents.get(attack.defenderTag);
      rows.push({
        id: `ataque-${attack.order}-${attack.attackerTag.replace("#", "")}`,
        order: attack.order,
        attacker: allies.get(attack.attackerTag) ?? attack.attackerTag,
        attackerTag: attack.attackerTag,
        defender: defender?.name ?? attack.defenderTag,
        defenderTag: attack.defenderTag,
        base: defender?.base ?? null,
        stars: attack.stars,
        destruction: attack.destructionPercentage,
        duration: attack.duration,
      });
    }
  }

  return rows.sort((left, right) => right.order - left.order);
}

function recentAttacks(war: ClashCurrentWar): WarAttackRow[] {
  return listClanAttacks(war).slice(0, 6);
}

function describeTime(
  war: ClashCurrentWar,
  now: number,
): { caption: string; value: string | null } {
  if (war.state === "ended" || war.state === "warEnded") {
    return { caption: "Guerra encerrada", value: null };
  }

  const target =
    war.state === "preparation" ||
    war.state === "matched" ||
    war.state === "enterWar"
      ? war.startTime
      : war.endTime;
  const caption =
    war.state === "preparation" ||
    war.state === "matched" ||
    war.state === "enterWar"
      ? "A guerra começa em"
      : "Tempo restante";

  if (!target) {
    return { caption: "Horário não informado pela API", value: null };
  }

  const instant = parseClashTime(target);
  if (instant === undefined) {
    return { caption: "Horário não informado pela API", value: null };
  }

  const remaining = instant - now;
  if (remaining <= 0) {
    return { caption: "Horário já alcançado", value: "0min" };
  }

  return { caption, value: formatDurationMs(remaining) };
}

function parseClashTime(value: string): number | undefined {
  const match = CLASH_TIME.exec(value);
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour, minute, second, millisecond] = match;
  if (!year || !month || !day || !hour || !minute || !second || !millisecond) {
    return undefined;
  }

  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond),
  );
}

function formatDurationMs(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  return `${minutes}min`;
}

function emptyResult(state: ClashWarState): DashboardResult {
  if (state === "inMatchmaking") {
    return {
      status: "empty",
      stateLabel: stateLabel(state),
      stateTone: "preparacao",
      title: "Buscando oponente",
      message:
        "O clã está em matchmaking. A API ainda não envia placar, ataques nem tempo restante.",
    };
  }

  if (state === "accessDenied") {
    return {
      status: "empty",
      stateLabel: stateLabel(state),
      stateTone: "nao-sincronizado",
      title: "Guerra indisponível",
      message: "A API negou o acesso à guerra atual deste clã.",
    };
  }

  if (state === "clanNotFound") {
    return {
      status: "empty",
      stateLabel: stateLabel(state),
      stateTone: "nao-sincronizado",
      title: "Clã não encontrado na guerra",
      message: "A API não encontrou uma guerra para esta tag.",
    };
  }

  return {
    status: "empty",
    stateLabel: stateLabel(state),
    stateTone: "nao-sincronizado",
    title: "Nenhuma guerra em andamento",
    message:
      "O clã não está em guerra. Não há placar, ataques pendentes nem tempo restante.",
  };
}

export function formatClashDay(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const instant = parseClashTime(value);
  if (instant === undefined) {
    return null;
  }

  return new Date(instant).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
}

export function stateLabel(state: ClashWarState): string {
  switch (state) {
    case "preparation":
      return "Preparação";
    case "war":
    case "inWar":
      return "Em guerra";
    case "ended":
    case "warEnded":
      return "Encerrada";
    case "inMatchmaking":
      return "Buscando oponente";
    case "enterWar":
      return "Entrando na guerra";
    case "matched":
      return "Oponente encontrado";
    case "notInWar":
      return "Fora de guerra";
    case "accessDenied":
      return "Acesso negado";
    case "clanNotFound":
      return "Clã não encontrado";
    default:
      return state;
  }
}

function stateTone(state: ClashWarState): DashboardTone {
  switch (state) {
    case "war":
    case "inWar":
      return "em-guerra";
    case "preparation":
    case "inMatchmaking":
    case "matched":
    case "enterWar":
      return "preparacao";
    case "ended":
    case "warEnded":
      return "concluido";
    default:
      return "nao-sincronizado";
  }
}

function numberOrNull(value: number | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function textOrFallback(value: string | undefined): string {
  return value && value.trim() ? value : "Não informado pela API";
}
