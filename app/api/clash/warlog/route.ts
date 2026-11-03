import {
  clashJson,
  configuredClanTag,
  listQueryFrom,
} from "@/app/api/clash/respond";
import { getWarLog } from "@/services/clash-of-clans";

export function GET(request: Request) {
  return clashJson(() =>
    getWarLog(configuredClanTag(), listQueryFrom(request)),
  );
}
