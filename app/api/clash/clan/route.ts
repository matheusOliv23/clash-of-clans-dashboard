import { clashJson, configuredClanTag } from "@/app/api/clash/respond";
import { getClan } from "@/services/clash-of-clans";

export function GET() {
  return clashJson(() => getClan(configuredClanTag()));
}
