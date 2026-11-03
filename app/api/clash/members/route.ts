import {
  clashJson,
  configuredClanTag,
  listQueryFrom,
} from "@/app/api/clash/respond";
import { getClanMembers } from "@/services/clash-of-clans";

export function GET(request: Request) {
  return clashJson(() =>
    getClanMembers(configuredClanTag(), listQueryFrom(request)),
  );
}
