import type { RankedPlayerHistory } from "@/features/members/ranked-league";

/**
 * Métricas individuais de guerra.
 *
 * Uma guerra só entra nas médias quando está finalizada e a API enviou o
 * elenco. Guerra em preparação, em andamento ou sem membros fica de fora.
 * Quem não estava no elenco não entra no denominador daquela guerra.
 *
 * Fórmulas, com A = ataques nas guerras finalizadas em que o jogador
 * estava no elenco e a API informou estrelas e destruição:
 *
 * - Guerras participadas: quantidade dessas guerras.
 * - Total de ataques: |A|.
 * - Média de estrelas: soma(estrelas) / |A|, ou vazia se |A| = 0.
 * - Média de destruição: soma(destruição) / |A|, ou vazia se |A| = 0.
 * - Taxa de triplo: |{ataque em A com 3 estrelas}| / |A|, ou vazia se |A| = 0.
 * - Ataques oferecidos: soma do limite por membro nas guerras participadas
 *   em que a API enviou esse limite. Sem o limite, o valor fica vazio.
 * - Participação: ataques feitos nessas guerras com limite / ataques
 *   oferecidos. Não usa guerras sem limite nem guerras em que o jogador
 *   não foi convocado.
 * - Evolução: média de destruição da metade mais recente das guerras em que
 *   ele atacou, menos a média da metade anterior. Exige pelo menos duas
 *   guerras com ataque e, em cada metade, pelo menos
 *   MIN_ATTACKS_PER_HALF ataques.
 *
 * Rankings de taxa (destruição, triplo e participação) e o de evolução
 * ignoram amostras abaixo do mínimo. O ranking de estrelas é uma soma, então
 * lista quem tem pelo menos um ataque e mostra o tamanho da amostra.
 */

export const MIN_ATTACKS_FOR_RATE = 5;
export const MIN_OFFERED_ATTACKS = 4;
export const MIN_ATTACKS_PER_HALF = 2;

export const METRIC_NOTES: { title: string; formula: string }[] = [
  {
    title: "Guerras participadas",
    formula:
      "Guerras finalizadas, no período e no tipo escolhidos, em que o jogador estava no elenco.",
  },
  {
    title: "Total de ataques",
    formula:
      "Ataques em que a API informou estrelas e percentual de destruição. Um ataque sem um desses campos não entra.",
  },
  {
    title: "Média de estrelas",
    formula:
      "Soma das estrelas desses ataques, dividida pelo total de ataques.",
  },
  {
    title: "Média de destruição",
    formula:
      "Soma dos percentuais de destruição, dividida pelo total de ataques.",
  },
  {
    title: "Participação",
    formula:
      "Ataques feitos dividido pelos ataques oferecidos, só nas guerras em que a API informou o limite por membro. Guerra sem convocação não reduz essa taxa.",
  },
  {
    title: "Taxa de triplo",
    formula: "Ataques com 3 estrelas dividido pelo total de ataques.",
  },
  {
    title: "Evolução",
    formula: `Diferença, em pontos percentuais de destruição, entre a metade mais recente e a metade anterior das guerras em que o jogador atacou. Cada metade precisa de pelo menos ${MIN_ATTACKS_PER_HALF} ataques.`,
  },
  {
    title: "Rankings de taxa",
    formula: `Destruição, triplo e participação só ranqueiam quem tem amostra mínima (${MIN_ATTACKS_FOR_RATE} ataques, ou ${MIN_OFFERED_ATTACKS} ataques oferecidos na participação).`,
  },
];

export const WAR_LEAGUE_NOTES: { title: string; formula: string }[] = [
  {
    title: "Liga de guerra",
    formula:
      "Só as rodadas do grupo atual em que a API enviou o elenco. Temporadas anteriores não vêm nesse endpoint.",
  },
  {
    title: "Ataques da liga",
    formula:
      "Entra o ataque que já tem estrelas e destruição, inclusive na guerra que ainda não terminou. Guerra em preparação, sem ataques, não conta como falha. Quem está no elenco e ainda não atacou numa guerra aberta também não recebe zero na média.",
  },
  {
    title: "Médias da liga de guerra",
    formula:
      "Média de estrelas, de destruição e de duração usam só os ataques registrados. A duração é a média, em segundos, dos ataques em que a API enviou esse campo. O total de estrelas e a quantidade de triplos somam esses ataques. A API da liga não informa o limite por membro, então não há taxa de participação. Cada card lista o elenco da liga, até 15 membros. Quem ainda não atacou fica no fim, sem receber zero.",
  },
  {
    title: "Top 10 da liga",
    formula:
      "Soma a posição em quatro critérios: total de estrelas, média de destruição, quantidade de triplos e média de duração. A posição 1 é a melhor em cada um. Empate no mesmo número divide a posição. A menor soma fica na frente. Sem duração informada, o membro fica por último nesse critério. Quem ainda não atacou não entra.",
  },
];

export type WarKind = "regular" | "league";

export type AttackRecord = {
  stars: number;
  destruction: number;
  order: number;
  duration?: number | null;
};

export type WarMemberRecord = {
  tag: string;
  name: string;
  townHall: number;
  attacks: AttackRecord[];
};

export type ObservedWar = {
  kind: WarKind;
  finished: boolean;
  endTime: string;
  /** Dia em que a rodada começou. Ausente no war log. */
  startTime?: string | null;
  opponentTag: string;
  opponentName: string;
  teamSize: number;
  attacksPerMember: number | null;
  season: string | null;
  round: number | null;
  /** Null quando a API não mandou o elenco. Lista vazia é um elenco vazio. */
  members: WarMemberRecord[] | null;
};

export type RosterMember = {
  tag: string;
  name: string;
  townHall: number;
  role?: "notMember" | "member" | "admin" | "coLeader" | "leader";
  trophies?: number;
  leagueName?: string | null;
  donations?: number;
  donationsReceived?: number;
  clanRank?: number;
};

export type PeriodId = "all" | "30d" | "90d" | "season";
export type WarKindFilter = "all" | "regular" | "league";

export type MemberSeriesPoint = {
  endTime: string;
  opponentName: string;
  attacks: number;
  averageStars: number | null;
  averageDestruction: number | null;
};

export type MemberStat = {
  tag: string;
  name: string;
  townHall: number;
  inClan: boolean;
  warsParticipated: number;
  attacks: number;
  stars: number;
  averageStars: number | null;
  averageDestruction: number | null;
  triples: number;
  tripleRate: number | null;
  offeredAttacks: number | null;
  participationRate: number | null;
  evolution: number | null;
  series: MemberSeriesPoint[];
};

export type RankingId =
  "stars" | "destruction" | "triples" | "participation" | "evolution";

export type RankingEntry = {
  tag: string;
  name: string;
  value: number;
  attacks: number;
  wars: number;
};

export type MemberStatsSnapshot = {
  clanName: string;
  clanTag: string;
  wars: ObservedWar[];
  roster: RosterMember[];
  seasonStart: string | null;
  generatedAt: string;
  notes: string[];
  persistenceError: string | null;
  rankedTiers: Record<string, string>;
  rankedPlayers: RankedPlayerHistory[];
};

export type MemberReport = {
  members: MemberStat[];
  rankings: Record<RankingId, RankingEntry[]>;
  excludedFromRanking: Record<Exclude<RankingId, "stars">, number>;
  finishedWarsWithRoster: number;
  finishedWarsWithoutRoster: number;
  unfinishedWars: number;
};

const FINISHED_STATES = new Set(["ended", "warEnded"]);

const CLASH_TIME = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/;

export function parseClashInstant(value: string): number | null {
  const match = CLASH_TIME.exec(value);
  if (!match) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const [, year, month, day, hour, minute, second, millisecond] = match;
  if (!year || !month || !day || !hour || !minute || !second || !millisecond) {
    return null;
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

export function isFinishedWarState(state: string | undefined): boolean {
  return state !== undefined && FINISHED_STATES.has(state);
}

type IncomingMember = {
  tag: string;
  name: string;
  townHall: number;
  attacks?: Array<{
    stars?: number;
    destruction?: number;
    order?: number;
    duration?: number;
  }>;
};

export type IncomingWar = {
  kind: WarKind;
  state?: string;
  /** O war log só devolve guerras já encerradas e não traz `state`. */
  finishedByEndpoint?: boolean;
  startTime?: string;
  endTime?: string;
  opponentTag?: string;
  opponentName?: string;
  teamSize?: number;
  attacksPerMember?: number;
  season?: string | null;
  round?: number | null;
  members?: IncomingMember[] | null;
};

export function warFromParts(input: IncomingWar): ObservedWar | null {
  if (!input.endTime || parseClashInstant(input.endTime) === null) {
    return null;
  }

  if (!input.teamSize || input.teamSize <= 0) {
    return null;
  }

  const finished =
    input.finishedByEndpoint === true || isFinishedWarState(input.state);
  if (!finished && input.state !== undefined && !isOpenWarState(input.state)) {
    return null;
  }

  const quota = knownQuota(input.attacksPerMember);

  return {
    kind: input.kind,
    finished,
    endTime: input.endTime,
    startTime:
      input.startTime && parseClashInstant(input.startTime) !== null
        ? input.startTime
        : null,
    opponentTag: input.opponentTag ?? "",
    opponentName: input.opponentName ?? "Oponente sem nome",
    teamSize: input.teamSize,
    attacksPerMember: quota,
    season: input.season ?? null,
    round: input.round ?? null,
    members:
      input.members === undefined || input.members === null
        ? null
        : input.members.map(cleanMember),
  };
}

export function warsInView(
  wars: readonly ObservedWar[],
  filter: {
    kind: WarKindFilter;
    period: PeriodId;
    now: number;
    seasonStart: number | null;
  },
): ObservedWar[] {
  return wars.filter((war) => {
    if (filter.kind !== "all" && war.kind !== filter.kind) {
      return false;
    }

    const end = parseClashInstant(war.endTime);
    if (end === null) {
      return false;
    }

    if (filter.period === "30d" || filter.period === "90d") {
      const days = filter.period === "30d" ? 30 : 90;
      return end >= filter.now - days * 24 * 60 * 60 * 1000;
    }

    if (filter.period === "season") {
      return filter.seasonStart === null || end >= filter.seasonStart;
    }

    return true;
  });
}

export type WarLeagueRoundStatus =
  "attacked" | "pending" | "missed" | "waiting";

export type WarLeagueRoundLine = {
  key: string;
  round: number | null;
  opponentName: string;
  endTime: string;
  startTime: string | null;
  status: WarLeagueRoundStatus;
  stars: number | null;
  destruction: number | null;
  duration: number | null;
  attacks: number;
};

export type WarLeaguePlayer = {
  tag: string;
  name: string;
  rounds: WarLeagueRoundLine[];
  attacks: number;
  stars: number;
  averageStars: number | null;
  averageDestruction: number | null;
  averageDuration: number | null;
  triples: number;
};

export type WarLeagueRank = {
  tag: string;
  name: string;
  value: number | null;
  attacks: number;
};

export type WarLeagueReport = {
  season: string | null;
  roundsWithRoster: number;
  startedRounds: number;
  players: WarLeaguePlayer[];
  rankings: {
    stars: WarLeagueRank[];
    destruction: WarLeagueRank[];
    triples: WarLeagueRank[];
    duration: WarLeagueRank[];
  };
  top: WarLeaguePlayer[];
};

export function buildWarLeagueReport(
  wars: readonly ObservedWar[],
  roster: readonly RosterMember[] = [],
): WarLeagueReport {
  const names = new Map(roster.map((member) => [member.tag, member.name]));
  const league = wars
    .filter((war) => war.kind === "league" && war.members !== null)
    .sort((left, right) => {
      const byRound = (left.round ?? 0) - (right.round ?? 0);
      if (byRound !== 0) {
        return byRound;
      }
      return (
        (parseClashInstant(left.endTime) ?? 0) -
        (parseClashInstant(right.endTime) ?? 0)
      );
    });

  const players = new Map<string, MutableLeaguePlayer>();

  for (const war of league) {
    const members = war.members ?? [];
    const started =
      war.finished || members.some((member) => member.attacks.length > 0);

    for (const member of members) {
      const player = ensureLeaguePlayer(players, member, names);
      const attacks = member.attacks;
      const stars =
        attacks.length === 0
          ? null
          : sum(attacks.map((attack) => attack.stars));
      const destruction =
        attacks.length === 0
          ? null
          : sum(attacks.map((attack) => attack.destruction)) / attacks.length;
      const durations = attacks.flatMap((attack) => {
        const duration = knownDuration(attack.duration);
        return duration === null ? [] : [duration];
      });
      const status: WarLeagueRoundStatus = !started
        ? "waiting"
        : attacks.length === 0
          ? war.finished
            ? "missed"
            : "pending"
          : "attacked";

      player.rounds.push({
        key: `${war.round ?? "x"}|${war.endTime}|${war.opponentTag}`,
        round: war.round,
        opponentName: war.opponentName,
        endTime: war.endTime,
        startTime: war.startTime ?? null,
        status,
        stars,
        destruction,
        duration:
          durations.length === 0 ? null : sum(durations) / durations.length,
        attacks: attacks.length,
      });

      if (status !== "attacked") {
        continue;
      }

      player.attacks += attacks.length;
      player.stars += stars ?? 0;
      player.destruction += sum(attacks.map((attack) => attack.destruction));
      player.duration += sum(durations);
      player.timedAttacks += durations.length;
      player.triples += attacks.filter((attack) => attack.stars === 3).length;
    }
  }

  const listed = [...players.values()].map(finishLeaguePlayer);

  return {
    season: league.find((war) => war.season)?.season ?? null,
    roundsWithRoster: league.length,
    startedRounds: league.filter(
      (war) =>
        war.finished ||
        (war.members ?? []).some((member) => member.attacks.length > 0),
    ).length,
    players: listed,
    rankings: {
      stars: rankLeague(
        listed,
        (player) => (player.attacks > 0 ? player.stars : null),
        "desc",
      ),
      destruction: rankLeague(
        listed,
        (player) => (player.attacks > 0 ? player.averageDestruction : null),
        "desc",
      ),
      triples: rankLeague(
        listed,
        (player) => (player.attacks > 0 ? player.triples : null),
        "desc",
      ),
      duration: rankLeague(listed, (player) => player.averageDuration, "asc"),
    },
    top: rankWarLeagueTop(listed),
  };
}

const WAR_LEAGUE_TOP_LIMIT = 10;

export function rankWarLeagueTop(
  players: readonly WarLeaguePlayer[],
  limit = WAR_LEAGUE_TOP_LIMIT,
): WarLeaguePlayer[] {
  const eligible = players.filter((player) => player.attacks > 0);
  const stars = criterionRank(eligible, (player) => player.stars, "desc");
  const destruction = criterionRank(
    eligible,
    (player) => player.averageDestruction,
    "desc",
  );
  const triples = criterionRank(eligible, (player) => player.triples, "desc");
  const duration = criterionRank(
    eligible,
    (player) => player.averageDuration,
    "asc",
  );

  return [...eligible]
    .sort((left, right) => {
      const leftScore = leagueTopScore(
        left.tag,
        stars,
        destruction,
        triples,
        duration,
      );
      const rightScore = leagueTopScore(
        right.tag,
        stars,
        destruction,
        triples,
        duration,
      );
      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return (
        right.stars - left.stars ||
        (right.averageDestruction ?? -1) - (left.averageDestruction ?? -1) ||
        right.triples - left.triples ||
        (left.averageDuration ?? Number.POSITIVE_INFINITY) -
          (right.averageDuration ?? Number.POSITIVE_INFINITY) ||
        left.name.localeCompare(right.name, "pt-BR")
      );
    })
    .slice(0, limit);
}

function leagueTopScore(
  tag: string,
  stars: ReadonlyMap<string, number>,
  destruction: ReadonlyMap<string, number>,
  triples: ReadonlyMap<string, number>,
  duration: ReadonlyMap<string, number>,
): number {
  return (
    (stars.get(tag) ?? 0) +
    (destruction.get(tag) ?? 0) +
    (triples.get(tag) ?? 0) +
    (duration.get(tag) ?? 0)
  );
}

function criterionRank(
  players: readonly WarLeaguePlayer[],
  valueOf: (player: WarLeaguePlayer) => number | null,
  direction: "asc" | "desc",
): Map<string, number> {
  const sorted = [...players].sort((left, right) => {
    const leftValue = valueOf(left);
    const rightValue = valueOf(right);
    if (leftValue === null || rightValue === null) {
      if (leftValue === rightValue) {
        return left.name.localeCompare(right.name, "pt-BR");
      }
      return leftValue === null ? 1 : -1;
    }

    const byValue =
      direction === "asc" ? leftValue - rightValue : rightValue - leftValue;
    return byValue || left.name.localeCompare(right.name, "pt-BR");
  });
  const ranks = new Map<string, number>();
  let index = 0;

  while (index < sorted.length) {
    const current = valueOf(sorted[index]!);
    let next = index + 1;
    while (next < sorted.length && valueOf(sorted[next]!) === current) {
      next += 1;
    }

    const shared = (index + 1 + next) / 2;
    for (let cursor = index; cursor < next; cursor += 1) {
      ranks.set(sorted[cursor]!.tag, shared);
    }
    index = next;
  }

  return ranks;
}

type MutableLeaguePlayer = {
  tag: string;
  name: string;
  rounds: WarLeagueRoundLine[];
  attacks: number;
  stars: number;
  destruction: number;
  duration: number;
  timedAttacks: number;
  triples: number;
};

function ensureLeaguePlayer(
  players: Map<string, MutableLeaguePlayer>,
  member: WarMemberRecord,
  names: ReadonlyMap<string, string>,
): MutableLeaguePlayer {
  const existing = players.get(member.tag);
  if (existing) {
    return existing;
  }

  const created: MutableLeaguePlayer = {
    tag: member.tag,
    name: names.get(member.tag) ?? member.name,
    rounds: [],
    attacks: 0,
    stars: 0,
    destruction: 0,
    duration: 0,
    timedAttacks: 0,
    triples: 0,
  };
  players.set(member.tag, created);
  return created;
}

function finishLeaguePlayer(player: MutableLeaguePlayer): WarLeaguePlayer {
  return {
    tag: player.tag,
    name: player.name,
    rounds: player.rounds,
    attacks: player.attacks,
    stars: player.stars,
    averageStars: player.attacks === 0 ? null : player.stars / player.attacks,
    averageDestruction:
      player.attacks === 0 ? null : player.destruction / player.attacks,
    averageDuration:
      player.timedAttacks === 0 ? null : player.duration / player.timedAttacks,
    triples: player.triples,
  };
}

function rankLeague(
  players: readonly WarLeaguePlayer[],
  valueOf: (player: WarLeaguePlayer) => number | null,
  direction: "asc" | "desc",
): WarLeagueRank[] {
  return players
    .map((player) => ({
      tag: player.tag,
      name: player.name,
      value: valueOf(player),
      attacks: player.attacks,
    }))
    .sort((left, right) => {
      if (left.value === null || right.value === null) {
        if (left.value === right.value) {
          return left.name.localeCompare(right.name, "pt-BR");
        }
        return left.value === null ? 1 : -1;
      }

      const byValue =
        direction === "asc"
          ? left.value - right.value
          : right.value - left.value;
      return byValue || left.name.localeCompare(right.name, "pt-BR");
    });
}

export function buildMemberReport(
  wars: readonly ObservedWar[],
  roster: readonly RosterMember[],
): MemberReport {
  const finishedWithRoster = wars.filter(
    (war) => war.finished && war.members !== null,
  );
  const identities = new Map<
    string,
    { name: string; townHall: number; inClan: boolean }
  >();

  for (const member of roster) {
    identities.set(member.tag, {
      name: member.name,
      townHall: member.townHall,
      inClan: true,
    });
  }

  const orderedWars = [...finishedWithRoster].sort((left, right) => {
    return (
      (parseClashInstant(left.endTime) ?? 0) -
      (parseClashInstant(right.endTime) ?? 0)
    );
  });

  for (const war of orderedWars) {
    for (const member of war.members ?? []) {
      const current = identities.get(member.tag);
      if (!current) {
        identities.set(member.tag, {
          name: member.name,
          townHall: member.townHall,
          inClan: false,
        });
        continue;
      }
      if (!current.inClan) {
        identities.set(member.tag, {
          name: member.name,
          townHall: member.townHall,
          inClan: false,
        });
      }
    }
  }

  const members = [...identities.entries()]
    .map(([tag, identity]) =>
      statFor(
        tag,
        identity,
        finishedWithRoster,
        roster.some((member) => member.tag === tag),
      ),
    )
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  return {
    members,
    rankings: {
      stars: rankBy(members, (member) =>
        member.attacks > 0 ? member.stars : null,
      ),
      destruction: rankBy(members, (member) =>
        member.attacks >= MIN_ATTACKS_FOR_RATE
          ? member.averageDestruction
          : null,
      ),
      triples: rankBy(members, (member) =>
        member.attacks >= MIN_ATTACKS_FOR_RATE ? member.tripleRate : null,
      ),
      participation: rankBy(members, (member) =>
        member.offeredAttacks !== null &&
        member.offeredAttacks >= MIN_OFFERED_ATTACKS
          ? member.participationRate
          : null,
      ),
      evolution: rankBy(members, (member) => member.evolution),
    },
    excludedFromRanking: {
      destruction: members.filter(
        (member) => member.attacks > 0 && member.attacks < MIN_ATTACKS_FOR_RATE,
      ).length,
      triples: members.filter(
        (member) => member.attacks > 0 && member.attacks < MIN_ATTACKS_FOR_RATE,
      ).length,
      participation: members.filter(
        (member) =>
          member.participationRate !== null &&
          (member.offeredAttacks ?? 0) < MIN_OFFERED_ATTACKS,
      ).length,
      evolution: members.filter(
        (member) => member.attacks > 0 && member.evolution === null,
      ).length,
    },
    finishedWarsWithRoster: finishedWithRoster.length,
    finishedWarsWithoutRoster: wars.filter(
      (war) => war.finished && war.members === null,
    ).length,
    unfinishedWars: wars.filter((war) => !war.finished).length,
  };
}

function statFor(
  tag: string,
  identity: { name: string; townHall: number; inClan: boolean },
  wars: readonly ObservedWar[],
  inClan: boolean,
): MemberStat {
  const played = wars.flatMap((war) => {
    const member = war.members?.find((candidate) => candidate.tag === tag);
    return member ? [{ war, member }] : [];
  });

  const attacks = played.flatMap((entry) => entry.member.attacks);
  const stars = sum(attacks.map((attack) => attack.stars));
  const destruction = sum(attacks.map((attack) => attack.destruction));
  const triples = attacks.filter((attack) => attack.stars === 3).length;
  const quotaWars = played.filter(
    (entry) => entry.war.attacksPerMember !== null,
  );
  const offered = sum(
    quotaWars.map((entry) => entry.war.attacksPerMember ?? 0),
  );
  const attacksInsideQuota = sum(
    quotaWars.map((entry) => entry.member.attacks.length),
  );

  const liveTownHall =
    inClan && identity.townHall > 0
      ? identity.townHall
      : latestTownHall(played) || identity.townHall;

  return {
    tag,
    name: identity.name,
    townHall: liveTownHall,
    inClan,
    warsParticipated: played.length,
    attacks: attacks.length,
    stars,
    averageStars: attacks.length === 0 ? null : stars / attacks.length,
    averageDestruction:
      attacks.length === 0 ? null : destruction / attacks.length,
    triples,
    tripleRate: attacks.length === 0 ? null : triples / attacks.length,
    offeredAttacks: quotaWars.length === 0 ? null : offered,
    participationRate:
      quotaWars.length === 0 || offered <= 0
        ? null
        : attacksInsideQuota / offered,
    evolution: evolutionOf(played),
    series: played.map(({ war, member }) => ({
      endTime: war.endTime,
      opponentName: war.opponentName,
      attacks: member.attacks.length,
      averageStars: average(member.attacks.map((attack) => attack.stars)),
      averageDestruction: average(
        member.attacks.map((attack) => attack.destruction),
      ),
    })),
  };
}

function evolutionOf(
  played: readonly { war: ObservedWar; member: WarMemberRecord }[],
): number | null {
  const withAttacks = [...played]
    .filter((entry) => entry.member.attacks.length > 0)
    .sort((left, right) => {
      const leftTime = parseClashInstant(left.war.endTime) ?? 0;
      const rightTime = parseClashInstant(right.war.endTime) ?? 0;
      return leftTime - rightTime;
    });

  if (withAttacks.length < 2) {
    return null;
  }

  const mid = Math.floor(withAttacks.length / 2);
  const earlier = withAttacks.slice(0, mid);
  const recent = withAttacks.slice(mid);
  const earlierAttacks = earlier.flatMap((entry) => entry.member.attacks);
  const recentAttacks = recent.flatMap((entry) => entry.member.attacks);

  if (
    earlierAttacks.length < MIN_ATTACKS_PER_HALF ||
    recentAttacks.length < MIN_ATTACKS_PER_HALF
  ) {
    return null;
  }

  const earlierAverage = average(
    earlierAttacks.map((attack) => attack.destruction),
  );
  const recentAverage = average(
    recentAttacks.map((attack) => attack.destruction),
  );
  if (earlierAverage === null || recentAverage === null) {
    return null;
  }

  return recentAverage - earlierAverage;
}

function rankBy(
  members: readonly MemberStat[],
  valueOf: (member: MemberStat) => number | null,
): RankingEntry[] {
  return members
    .flatMap((member) => {
      const value = valueOf(member);
      return value === null
        ? []
        : [
            {
              tag: member.tag,
              name: member.name,
              value,
              attacks: member.attacks,
              wars: member.warsParticipated,
            },
          ];
    })
    .sort(
      (left, right) =>
        right.value - left.value ||
        left.name.localeCompare(right.name, "pt-BR"),
    );
}

function cleanMember(member: IncomingMember): WarMemberRecord {
  return {
    tag: member.tag,
    name: member.name,
    townHall: member.townHall,
    attacks: (member.attacks ?? []).flatMap((attack) => {
      if (
        typeof attack.stars !== "number" ||
        typeof attack.destruction !== "number"
      ) {
        return [];
      }
      return [
        {
          stars: attack.stars,
          destruction: attack.destruction,
          order: typeof attack.order === "number" ? attack.order : 0,
          duration: knownDuration(attack.duration),
        },
      ];
    }),
  };
}

function knownDuration(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

function knownQuota(value: number | undefined): number | null {
  if (value === undefined || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

function isOpenWarState(state: string): boolean {
  return (
    state === "preparation" ||
    state === "war" ||
    state === "inWar" ||
    state === "matched" ||
    state === "enterWar"
  );
}

function latestTownHall(
  played: readonly { member: WarMemberRecord; war: ObservedWar }[],
): number {
  const ordered = [...played].sort((left, right) => {
    const leftTime = parseClashInstant(left.war.endTime) ?? 0;
    const rightTime = parseClashInstant(right.war.endTime) ?? 0;
    return rightTime - leftTime;
  });
  return ordered[0]?.member.townHall ?? 0;
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return sum(values) / values.length;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
