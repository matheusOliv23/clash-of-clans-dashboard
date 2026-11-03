import { clashJson, configuredClanTag } from "@/app/api/clash/respond";
import { getCurrentWar } from "@/services/clash-of-clans";

export function GET() {
  return clashJson(() => getCurrentWar(configuredClanTag()));
}
