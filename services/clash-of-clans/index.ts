import "server-only";

export { clearClashCache } from "@/services/clash-of-clans/cache";
export {
  getClan,
  getClanMembers,
  getCurrentLeagueGroup,
  getCurrentWar,
  getLeagueWar,
  getWarLog,
  type ClashReadOptions,
} from "@/services/clash-of-clans/clans";
export { CLASH_API_BASE_URL } from "@/services/clash-of-clans/client";
export {
  ClashApiError,
  ClashRequestError,
  type ClashApiErrorKind,
} from "@/services/clash-of-clans/errors";
export {
  collectClanSnapshot,
  type ClashClanSnapshot,
  type ClashWarLogResult,
} from "@/services/clash-of-clans/snapshot";
export {
  getLeagueTiers,
  getPlayerLeagueHistory,
} from "@/services/clash-of-clans/players";
export {
  encodeClashTag,
  normalizeClanTag,
  normalizeClashTag,
  normalizePlayerTag,
} from "@/services/clash-of-clans/tags";
