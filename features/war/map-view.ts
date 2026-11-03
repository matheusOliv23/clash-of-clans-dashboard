import type { ClashCurrentWar } from "@/types/clash-of-clans";

export type WarMapAttack = {
  order: number;
  attackerName: string;
  attackerTag: string;
  stars: number;
  destruction: number;
  duration: number;
};

export type WarMapBase = {
  id: string;
  position: number;
  townHall: number;
  name: string;
  tag: string;
  stars: number | null;
  destruction: number | null;
  attackCount: number;
  attacks: WarMapAttack[];
};

export type WarMapView = {
  warKey: string;
  clanName: string;
  opponentName: string;
  bases: WarMapBase[];
};

export function presentWarMap(war: ClashCurrentWar): WarMapView | null {
  const defenders = war.opponent?.members;
  if (!defenders || defenders.length === 0) {
    return null;
  }

  const names = new Map(
    (war.clan?.members ?? []).map((member) => [member.tag, member.name]),
  );
  const attacksByDefender = new Map<string, WarMapAttack[]>();

  for (const member of war.clan?.members ?? []) {
    for (const attack of member.attacks ?? []) {
      const list = attacksByDefender.get(attack.defenderTag) ?? [];
      list.push({
        order: attack.order,
        attackerName: names.get(attack.attackerTag) ?? attack.attackerTag,
        attackerTag: attack.attackerTag,
        stars: attack.stars,
        destruction: attack.destructionPercentage,
        duration: attack.duration,
      });
      attacksByDefender.set(attack.defenderTag, list);
    }
  }

  const bases = defenders
    .map((defender) => {
      const attacks = (attacksByDefender.get(defender.tag) ?? []).sort(
        (left, right) => left.order - right.order,
      );
      const best = defender.bestOpponentAttack;

      return {
        id: `base-${defender.mapPosition}`,
        position: defender.mapPosition,
        townHall: defender.townhallLevel,
        name: defender.name,
        tag: defender.tag,
        stars:
          best?.stars ??
          (attacks.length > 0
            ? Math.max(...attacks.map((attack) => attack.stars))
            : defender.opponentAttacks === 0
              ? 0
              : null),
        destruction:
          best?.destructionPercentage ??
          (attacks.length > 0
            ? Math.max(...attacks.map((attack) => attack.destruction))
            : null),
        attackCount: defender.opponentAttacks,
        attacks,
      };
    })
    .sort((left, right) => left.position - right.position);

  return {
    warKey: [
      war.clan?.tag ?? "clan",
      war.opponent?.tag ?? "opponent",
      war.endTime ?? war.startTime ?? war.state,
    ].join(":"),
    clanName: war.clan?.name ?? "Não informado pela API",
    opponentName: war.opponent?.name ?? "Não informado pela API",
    bases,
  };
}

export function formatAttackDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "Duração não informada";
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) {
    return `${rest}s`;
  }
  return `${minutes}min ${rest}s`;
}
