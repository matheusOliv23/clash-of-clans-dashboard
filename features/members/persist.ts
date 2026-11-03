import "server-only";

import { getPrisma } from "@/lib/prisma";
import {
  parseClashInstant,
  type AttackRecord,
  type ObservedWar,
  type WarMemberRecord,
} from "@/features/members/metrics";

export async function persistWars(
  clanTag: string,
  clanName: string | null,
  wars: readonly ObservedWar[],
): Promise<void> {
  const prisma = getPrisma();
  const clan = await prisma.clan.upsert({
    where: { tag: clanTag },
    create: { tag: clanTag, name: clanName, syncedAt: new Date() },
    update: { name: clanName, syncedAt: new Date() },
  });

  for (const war of wars) {
    const instant = parseClashInstant(war.endTime);
    if (instant === null) {
      continue;
    }
    const endTime = new Date(instant);
    const identity = {
      clanId: clan.id,
      kind: war.kind,
      endTime,
      opponentTag: war.opponentTag,
    };
    const existing = await prisma.warRecord.findUnique({
      where: { clanId_kind_endTime_opponentTag: identity },
    });
    const saved = existing
      ? await prisma.warRecord.update({
          where: { id: existing.id },
          data: {
            finished: existing.finished || war.finished,
            rosterKnown: existing.rosterKnown || war.members !== null,
            opponentName: war.opponentName,
            teamSize: war.teamSize,
            attacksPerMember: war.attacksPerMember ?? existing.attacksPerMember,
            season: war.season ?? existing.season,
            round: war.round ?? existing.round,
          },
        })
      : await prisma.warRecord.create({
          data: {
            ...identity,
            finished: war.finished,
            rosterKnown: war.members !== null,
            opponentName: war.opponentName,
            teamSize: war.teamSize,
            attacksPerMember: war.attacksPerMember,
            season: war.season,
            round: war.round,
          },
        });

    if (war.members === null) {
      continue;
    }

    await prisma.warParticipation.deleteMany({ where: { warId: saved.id } });
    if (war.members.length === 0) {
      continue;
    }

    await prisma.warParticipation.createMany({
      data: war.members.map((member) => ({
        warId: saved.id,
        playerTag: member.tag,
        playerName: member.name,
        townHall: member.townHall,
        attacks: member.attacks,
      })),
    });
  }
}

export async function readPersistedWars(
  clanTag: string,
): Promise<ObservedWar[]> {
  const prisma = getPrisma();
  const clan = await prisma.clan.findUnique({
    where: { tag: clanTag },
    include: {
      wars: { include: { participations: true }, orderBy: { endTime: "asc" } },
    },
  });

  if (!clan) {
    return [];
  }

  return clan.wars.map((war) => ({
    kind: war.kind === "league" ? "league" : "regular",
    finished: war.finished,
    endTime: war.endTime.toISOString(),
    opponentTag: war.opponentTag,
    opponentName: war.opponentName,
    teamSize: war.teamSize,
    attacksPerMember: war.attacksPerMember,
    season: war.season,
    round: war.round,
    members: war.rosterKnown
      ? war.participations.map((participation): WarMemberRecord => ({
          tag: participation.playerTag,
          name: participation.playerName,
          townHall: participation.townHall,
          attacks: readAttacks(participation.attacks),
        }))
      : null,
  }));
}

function readAttacks(value: unknown): AttackRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const attack = item as {
      stars?: unknown;
      destruction?: unknown;
      order?: unknown;
      duration?: unknown;
    };
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
        duration:
          typeof attack.duration === "number" &&
          Number.isFinite(attack.duration) &&
          attack.duration >= 0
            ? attack.duration
            : null,
      },
    ];
  });
}
