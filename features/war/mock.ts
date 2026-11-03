/**
 * Dados fictícios da interface.
 * Não representam jogadores, clãs ou guerras reais e não vêm da API da Supercell.
 */

export const mockClan = {
  name: "Clã Demonstração",
  tag: "#0000",
  initials: "CD",
  level: 18,
} as const;

export const mockOpponent = {
  name: "Oponente Ilustrativo",
  tag: "#DEMO",
} as const;

export const mockWar = {
  state: "em-guerra" as const,
  teamSize: 15,
  attacksPerMember: 2,
  timeRemainingLabel: "18h 24min",
  clanStars: 32,
  clanDestruction: 78.4,
  opponentStars: 27,
  opponentDestruction: 71.2,
};

export type MockRole = "Líder" | "Colíder" | "Ancião" | "Membro";

export type MockMember = {
  id: string;
  name: string;
  tag: string;
  role: MockRole;
  townHall: number;
  attacksUsed: number;
  attacksTotal: number;
  stars: number;
  destruction: number;
};

export const mockMembers: MockMember[] = [
  {
    id: "m01",
    name: "Membro 01",
    tag: "#M001",
    role: "Líder",
    townHall: 16,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 6,
    destruction: 100,
  },
  {
    id: "m02",
    name: "Membro 02",
    tag: "#M002",
    role: "Colíder",
    townHall: 16,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 5,
    destruction: 97,
  },
  {
    id: "m03",
    name: "Membro 03",
    tag: "#M003",
    role: "Colíder",
    townHall: 15,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 4,
    destruction: 86,
  },
  {
    id: "m04",
    name: "Membro 04",
    tag: "#M004",
    role: "Ancião",
    townHall: 15,
    attacksUsed: 1,
    attacksTotal: 2,
    stars: 3,
    destruction: 100,
  },
  {
    id: "m05",
    name: "Membro 05",
    tag: "#M005",
    role: "Ancião",
    townHall: 15,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 4,
    destruction: 91,
  },
  {
    id: "m06",
    name: "Membro 06",
    tag: "#M006",
    role: "Membro",
    townHall: 14,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 3,
    destruction: 80,
  },
  {
    id: "m07",
    name: "Membro 07",
    tag: "#M007",
    role: "Membro",
    townHall: 14,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 2,
    destruction: 70,
  },
  {
    id: "m08",
    name: "Membro 08",
    tag: "#M008",
    role: "Membro",
    townHall: 14,
    attacksUsed: 1,
    attacksTotal: 2,
    stars: 2,
    destruction: 88,
  },
  {
    id: "m09",
    name: "Membro 09",
    tag: "#M009",
    role: "Membro",
    townHall: 13,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 3,
    destruction: 82,
  },
  {
    id: "m10",
    name: "Membro 10",
    tag: "#M010",
    role: "Membro",
    townHall: 13,
    attacksUsed: 1,
    attacksTotal: 2,
    stars: 1,
    destruction: 55,
  },
  {
    id: "m11",
    name: "Membro 11",
    tag: "#M011",
    role: "Membro",
    townHall: 13,
    attacksUsed: 2,
    attacksTotal: 2,
    stars: 3,
    destruction: 79,
  },
  {
    id: "m12",
    name: "Membro 12",
    tag: "#M012",
    role: "Membro",
    townHall: 12,
    attacksUsed: 1,
    attacksTotal: 2,
    stars: 2,
    destruction: 91,
  },
  {
    id: "m13",
    name: "Membro 13",
    tag: "#M013",
    role: "Membro",
    townHall: 12,
    attacksUsed: 1,
    attacksTotal: 2,
    stars: 0,
    destruction: 42,
  },
  {
    id: "m14",
    name: "Membro 14",
    tag: "#M014",
    role: "Membro",
    townHall: 12,
    attacksUsed: 0,
    attacksTotal: 2,
    stars: 0,
    destruction: 0,
  },
  {
    id: "m15",
    name: "Membro 15",
    tag: "#M015",
    role: "Membro",
    townHall: 11,
    attacksUsed: 0,
    attacksTotal: 2,
    stars: 0,
    destruction: 0,
  },
];

export type MockBase = {
  position: number;
  defender: string;
  townHall: number;
  stars: 0 | 1 | 2 | 3;
  destruction: number;
  attacker: string | null;
  attackerId: string | null;
};

export const mockBases: MockBase[] = [
  {
    position: 1,
    defender: "Defensor 01",
    townHall: 16,
    stars: 3,
    destruction: 100,
    attacker: "Membro 01",
    attackerId: "m01",
  },
  {
    position: 2,
    defender: "Defensor 02",
    townHall: 16,
    stars: 3,
    destruction: 98,
    attacker: "Membro 02",
    attackerId: "m02",
  },
  {
    position: 3,
    defender: "Defensor 03",
    townHall: 15,
    stars: 2,
    destruction: 86,
    attacker: "Membro 03",
    attackerId: "m03",
  },
  {
    position: 4,
    defender: "Defensor 04",
    townHall: 15,
    stars: 3,
    destruction: 100,
    attacker: "Membro 05",
    attackerId: "m05",
  },
  {
    position: 5,
    defender: "Defensor 05",
    townHall: 15,
    stars: 2,
    destruction: 74,
    attacker: "Membro 06",
    attackerId: "m06",
  },
  {
    position: 6,
    defender: "Defensor 06",
    townHall: 14,
    stars: 1,
    destruction: 61,
    attacker: "Membro 07",
    attackerId: "m07",
  },
  {
    position: 7,
    defender: "Defensor 07",
    townHall: 14,
    stars: 3,
    destruction: 100,
    attacker: "Membro 04",
    attackerId: "m04",
  },
  {
    position: 8,
    defender: "Defensor 08",
    townHall: 14,
    stars: 2,
    destruction: 82,
    attacker: "Membro 09",
    attackerId: "m09",
  },
  {
    position: 9,
    defender: "Defensor 09",
    townHall: 13,
    stars: 2,
    destruction: 79,
    attacker: "Membro 11",
    attackerId: "m11",
  },
  {
    position: 10,
    defender: "Defensor 10",
    townHall: 13,
    stars: 0,
    destruction: 42,
    attacker: "Membro 13",
    attackerId: "m13",
  },
  {
    position: 11,
    defender: "Defensor 11",
    townHall: 13,
    stars: 3,
    destruction: 97,
    attacker: "Membro 02",
    attackerId: "m02",
  },
  {
    position: 12,
    defender: "Defensor 12",
    townHall: 12,
    stars: 2,
    destruction: 88,
    attacker: "Membro 08",
    attackerId: "m08",
  },
  {
    position: 13,
    defender: "Defensor 13",
    townHall: 12,
    stars: 1,
    destruction: 55,
    attacker: "Membro 10",
    attackerId: "m10",
  },
  {
    position: 14,
    defender: "Defensor 14",
    townHall: 12,
    stars: 3,
    destruction: 100,
    attacker: "Membro 01",
    attackerId: "m01",
  },
  {
    position: 15,
    defender: "Defensor 15",
    townHall: 11,
    stars: 2,
    destruction: 91,
    attacker: "Membro 12",
    attackerId: "m12",
  },
];

export type MockAttack = {
  id: string;
  order: number;
  attackerId: string;
  attacker: string;
  base: number;
  defender: string;
  stars: 0 | 1 | 2 | 3;
  destruction: number;
  durationSeconds: number;
  timeLabel: string;
};

export const mockAttacks: MockAttack[] = [
  {
    id: "atk-21",
    order: 21,
    attackerId: "m04",
    attacker: "Membro 04",
    base: 7,
    defender: "Defensor 07",
    stars: 3,
    destruction: 100,
    durationSeconds: 142,
    timeLabel: "há 12 min",
  },
  {
    id: "atk-20",
    order: 20,
    attackerId: "m08",
    attacker: "Membro 08",
    base: 12,
    defender: "Defensor 12",
    stars: 2,
    destruction: 88,
    durationSeconds: 168,
    timeLabel: "há 27 min",
  },
  {
    id: "atk-19",
    order: 19,
    attackerId: "m10",
    attacker: "Membro 10",
    base: 13,
    defender: "Defensor 13",
    stars: 1,
    destruction: 55,
    durationSeconds: 179,
    timeLabel: "há 41 min",
  },
  {
    id: "atk-18",
    order: 18,
    attackerId: "m13",
    attacker: "Membro 13",
    base: 10,
    defender: "Defensor 10",
    stars: 0,
    destruction: 42,
    durationSeconds: 154,
    timeLabel: "há 1 h",
  },
  {
    id: "atk-17",
    order: 17,
    attackerId: "m12",
    attacker: "Membro 12",
    base: 15,
    defender: "Defensor 15",
    stars: 2,
    destruction: 91,
    durationSeconds: 133,
    timeLabel: "há 1 h",
  },
  {
    id: "atk-16",
    order: 16,
    attackerId: "m02",
    attacker: "Membro 02",
    base: 11,
    defender: "Defensor 11",
    stars: 3,
    destruction: 97,
    durationSeconds: 121,
    timeLabel: "há 2 h",
  },
  {
    id: "atk-15",
    order: 15,
    attackerId: "m01",
    attacker: "Membro 01",
    base: 14,
    defender: "Defensor 14",
    stars: 3,
    destruction: 100,
    durationSeconds: 118,
    timeLabel: "há 2 h",
  },
  {
    id: "atk-14",
    order: 14,
    attackerId: "m09",
    attacker: "Membro 09",
    base: 8,
    defender: "Defensor 08",
    stars: 2,
    destruction: 82,
    durationSeconds: 160,
    timeLabel: "há 3 h",
  },
];

export type MockWarResult = "vitoria" | "derrota" | "empate";

export type MockPastWar = {
  id: string;
  opponent: string;
  tag: string;
  result: MockWarResult;
  ourStars: number;
  theirStars: number;
};

export const mockPastWars: MockPastWar[] = [
  {
    id: "h1",
    opponent: "Oponente Alfa",
    tag: "#A001",
    result: "vitoria",
    ourStars: 42,
    theirStars: 31,
  },
  {
    id: "h2",
    opponent: "Oponente Beta",
    tag: "#B002",
    result: "derrota",
    ourStars: 28,
    theirStars: 35,
  },
  {
    id: "h3",
    opponent: "Oponente Gama",
    tag: "#C003",
    result: "empate",
    ourStars: 30,
    theirStars: 30,
  },
  {
    id: "h4",
    opponent: "Oponente Delta",
    tag: "#D004",
    result: "vitoria",
    ourStars: 39,
    theirStars: 24,
  },
];

export const maxWarStars = mockWar.teamSize * 3;
export const maxAttacks = mockWar.teamSize * mockWar.attacksPerMember;

export const attacksUsed = mockMembers.reduce(
  (total, member) => total + member.attacksUsed,
  0,
);

export const pendingAttacks = mockMembers.reduce(
  (total, member) => total + (member.attacksTotal - member.attacksUsed),
  0,
);

export const membersOnWar = mockMembers.length;

export function membersWithPendingAttacks(): MockMember[] {
  return mockMembers
    .filter((member) => member.attacksUsed < member.attacksTotal)
    .sort((left, right) => {
      const remaining =
        right.attacksTotal -
        right.attacksUsed -
        (left.attacksTotal - left.attacksUsed);
      if (remaining !== 0) {
        return remaining;
      }
      return left.name.localeCompare(right.name, "pt-BR");
    });
}

export function recentAttacks(limit = 5): MockAttack[] {
  return [...mockAttacks]
    .sort((left, right) => right.order - left.order)
    .slice(0, limit);
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const mapStars = mockBases.reduce((total, base) => total + base.stars, 0);

if (mapStars !== mockWar.clanStars) {
  throw new Error(
    "As estrelas do mapa ilustrativo não fecham com o total do clã.",
  );
}

if (
  mockBases.length !== mockWar.teamSize ||
  mockMembers.length !== mockWar.teamSize
) {
  throw new Error("O elenco ilustrativo não tem o tamanho da guerra.");
}
