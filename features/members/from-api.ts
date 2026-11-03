import type {
  ClashCurrentWar,
  ClashWarLogEntry,
  ClashWarMember,
} from "@/types/clash-of-clans";

import {
  warFromParts,
  type ObservedWar,
  type WarKind,
} from "@/features/members/metrics";

export function observedFromWarLog(
  entry: ClashWarLogEntry,
): ObservedWar | null {
  return warFromParts({
    kind: "regular",
    finishedByEndpoint: true,
    endTime: entry.endTime,
    opponentTag: entry.opponent.tag,
    opponentName: entry.opponent.name,
    teamSize: entry.teamSize,
    attacksPerMember: entry.attacksPerMember,
    members: mapMembers(entry.clan.members),
  });
}

export function observedFromClanWar(
  war: ClashCurrentWar,
  meta: {
    kind: WarKind;
    season?: string | null;
    round?: number | null;
  },
): ObservedWar | null {
  return warFromParts({
    kind: meta.kind,
    state: war.state,
    startTime: war.startTime,
    endTime: war.endTime,
    opponentTag: war.opponent?.tag,
    opponentName: war.opponent?.name,
    teamSize: war.teamSize,
    attacksPerMember: war.attacksPerMember,
    season: meta.season,
    round: meta.round,
    members: mapMembers(war.clan?.members),
  });
}

function mapMembers(
  members: ClashWarMember[] | undefined,
): IncomingMembers | null {
  if (!members) {
    return null;
  }

  return members.map((member) => ({
    tag: member.tag,
    name: member.name,
    townHall: member.townhallLevel,
    attacks: (member.attacks ?? []).map((attack) => ({
      stars: attack.stars,
      destruction: attack.destructionPercentage,
      order: attack.order,
      duration: attack.duration,
    })),
  }));
}

type IncomingMembers = {
  tag: string;
  name: string;
  townHall: number;
  attacks: Array<{
    stars: number;
    destruction: number;
    order: number;
    duration?: number;
  }>;
}[];
