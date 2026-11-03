import "server-only";

import { withCache } from "@/services/clash-of-clans/cache";
import { clashFetch } from "@/services/clash-of-clans/client";
import { encodeClashTag } from "@/services/clash-of-clans/tags";
import type {
  ClashLeagueTier,
  ClashPage,
  ClashPlayerLeagueHistory,
} from "@/types/clash-of-clans";

const LEAGUE_TIERS_TTL_MS = 6 * 60 * 60 * 1000;
const PLAYER_LEAGUE_HISTORY_TTL_MS = 60 * 60 * 1000;

/**
 * GET /leaguetiers
 * https://api.clashofclans.com/v1/leaguetiers
 */
export async function getLeagueTiers(): Promise<ClashLeagueTier[]> {
  const tiers: ClashLeagueTier[] = [];
  let after: string | undefined;

  for (let page = 0; page < 5; page += 1) {
    const path = `leaguetiers${after ? `?after=${encodeURIComponent(after)}` : ""}`;
    const result = await withCache(path, LEAGUE_TIERS_TTL_MS, () =>
      clashFetch<ClashPage<ClashLeagueTier>>(path),
    );
    tiers.push(...result.items);
    after = result.paging?.cursors?.after ?? result.paging?.after;
    if (!after) {
      break;
    }
  }

  return tiers;
}

/**
 * GET /players/{playerTag}/leaguehistory
 * https://api.clashofclans.com/v1/players/{playerTag}/leaguehistory
 */
export function getPlayerLeagueHistory(
  tag: string,
): Promise<ClashPlayerLeagueHistory> {
  const path = `players/${encodeClashTag(tag)}/leaguehistory`;
  return withCache(path, PLAYER_LEAGUE_HISTORY_TTL_MS, () =>
    clashFetch<ClashPlayerLeagueHistory>(path),
  );
}
