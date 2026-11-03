import "server-only";

import {
  getClan,
  getClanMembers,
  getCurrentWar,
  getWarLog,
  type ClashReadOptions,
} from "@/services/clash-of-clans/clans";
import { ClashApiError } from "@/services/clash-of-clans/errors";
import type {
  ClashClan,
  ClashClanMemberList,
  ClashCurrentWar,
  ClashWarLog,
} from "@/types/clash-of-clans";

export type ClashWarLogResult =
  | { available: true; log: ClashWarLog }
  | {
      available: false;
      status: number;
      reason: string | undefined;
      message: string;
    };

/**
 * Pacote das quatro consultas oficiais.
 * Não grava no banco. Um agendador futuro pode chamar esta função
 * e persistir o resultado depois.
 */
export type ClashClanSnapshot = {
  fetchedAt: string;
  clan: ClashClan;
  members: ClashClanMemberList;
  currentWar: ClashCurrentWar;
  warLog: ClashWarLogResult;
};

export async function collectClanSnapshot(
  tag: string,
  options?: ClashReadOptions,
): Promise<ClashClanSnapshot> {
  const [clan, members, currentWar] = await Promise.all([
    getClan(tag, options),
    getClanMembers(tag, undefined, options),
    getCurrentWar(tag, options),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    clan,
    members,
    currentWar,
    warLog: await readWarLog(tag, options),
  };
}

async function readWarLog(
  tag: string,
  options?: ClashReadOptions,
): Promise<ClashWarLogResult> {
  try {
    return { available: true, log: await getWarLog(tag, undefined, options) };
  } catch (error) {
    if (
      error instanceof ClashApiError &&
      (error.status === 403 || error.status === 404)
    ) {
      return {
        available: false,
        status: error.status,
        reason: error.reason,
        message: error.message,
      };
    }

    throw error;
  }
}
