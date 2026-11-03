import "server-only";

import { withCache } from "@/services/clash-of-clans/cache";
import { clashFetch } from "@/services/clash-of-clans/client";
import { ClashRequestError } from "@/services/clash-of-clans/errors";
import { encodeClashTag } from "@/services/clash-of-clans/tags";
import type {
  ClashClan,
  ClashClanMemberList,
  ClashCurrentWar,
  ClashLeagueGroup,
  ClashListQuery,
  ClashWarLog,
} from "@/types/clash-of-clans";

const CLAN_TTL_MS = 5 * 60_000;
const MEMBERS_TTL_MS = 2 * 60_000;
export const CURRENT_WAR_TTL_MS = 60_000;
const WAR_LOG_TTL_MS = 10 * 60_000;

export type ClashReadOptions = {
  refresh?: boolean;
};

/**
 * GET /clans/{clanTag}
 * https://api.clashofclans.com/v1/clans/{clanTag}
 */
export function getClan(
  tag: string,
  options?: ClashReadOptions,
): Promise<ClashClan> {
  const path = `clans/${encodeClashTag(tag)}`;
  return withCache(
    path,
    CLAN_TTL_MS,
    () => clashFetch<ClashClan>(path),
    options?.refresh,
  );
}

/**
 * GET /clans/{clanTag}/members
 * https://api.clashofclans.com/v1/clans/{clanTag}/members
 */
export function getClanMembers(
  tag: string,
  query?: ClashListQuery,
  options?: ClashReadOptions,
): Promise<ClashClanMemberList> {
  const path = `clans/${encodeClashTag(tag)}/members${toQuery(query)}`;
  return withCache(
    path,
    MEMBERS_TTL_MS,
    () => clashFetch<ClashClanMemberList>(path),
    options?.refresh,
  );
}

/**
 * GET /clans/{clanTag}/currentwar
 * https://api.clashofclans.com/v1/clans/{clanTag}/currentwar
 */
export function getCurrentWar(
  tag: string,
  options?: ClashReadOptions,
): Promise<ClashCurrentWar> {
  const path = `clans/${encodeClashTag(tag)}/currentwar`;
  return withCache(
    path,
    CURRENT_WAR_TTL_MS,
    () => clashFetch<ClashCurrentWar>(path),
    options?.refresh,
  );
}

/**
 * GET /clans/{clanTag}/currentwar/leaguegroup
 * https://api.clashofclans.com/v1/clans/{clanTag}/currentwar/leaguegroup
 */
export function getCurrentLeagueGroup(
  tag: string,
  options?: ClashReadOptions,
): Promise<ClashLeagueGroup> {
  const path = `clans/${encodeClashTag(tag)}/currentwar/leaguegroup`;
  return withCache(
    path,
    CURRENT_WAR_TTL_MS,
    () => clashFetch<ClashLeagueGroup>(path),
    options?.refresh,
  );
}

/**
 * GET /clanwarleagues/wars/{warTag}
 * https://api.clashofclans.com/v1/clanwarleagues/wars/{warTag}
 */
export function getLeagueWar(
  warTag: string,
  options?: ClashReadOptions,
): Promise<ClashCurrentWar> {
  const path = `clanwarleagues/wars/${encodeClashTag(warTag)}`;
  return withCache(
    path,
    CURRENT_WAR_TTL_MS,
    () => clashFetch<ClashCurrentWar>(path),
    options?.refresh,
  );
}

/**
 * GET /clans/{clanTag}/warlog
 * https://api.clashofclans.com/v1/clans/{clanTag}/warlog
 *
 * Só responde quando o histórico de guerra do clã é público.
 */
export function getWarLog(
  tag: string,
  query?: ClashListQuery,
  options?: ClashReadOptions,
): Promise<ClashWarLog> {
  const path = `clans/${encodeClashTag(tag)}/warlog${toQuery(query)}`;
  return withCache(
    path,
    WAR_LOG_TTL_MS,
    () => clashFetch<ClashWarLog>(path),
    options?.refresh,
  );
}

export function toQuery(query?: ClashListQuery): string {
  if (!query) {
    return "";
  }

  if (query.after && query.before) {
    throw new ClashRequestError(
      "Os parâmetros after e before da API oficial são mutuamente exclusivos.",
    );
  }

  if (
    query.limit !== undefined &&
    (!Number.isInteger(query.limit) || query.limit < 1)
  ) {
    throw new ClashRequestError(
      "O parâmetro limit precisa ser um inteiro positivo.",
    );
  }

  const params = new URLSearchParams();

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.after) {
    params.set("after", query.after);
  }

  if (query.before) {
    params.set("before", query.before);
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
