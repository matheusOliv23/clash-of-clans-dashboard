import "server-only";

import { isEnvSet } from "@/lib/env";

export type ClanSetupStatus = {
  clanTagConfigured: boolean;
  apiKeyConfigured: boolean;
  databaseConfigured: boolean;
};

export function getClanSetupStatus(): ClanSetupStatus {
  return {
    clanTagConfigured: isEnvSet("CLAN_TAG"),
    apiKeyConfigured: isEnvSet("CLASH_API_KEY"),
    databaseConfigured: isEnvSet("DATABASE_URL"),
  };
}
