import { connection } from "next/server";

import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { loadClanIdentity } from "@/features/war/load";

export async function LiveSidebar() {
  await connection();
  const identity = await loadClanIdentity();

  return <Sidebar clanName={identity.name} clanTag={identity.tag} />;
}

export async function LiveHeader() {
  await connection();
  const identity = await loadClanIdentity();

  return (
    <AppHeader
      clanName={identity.name}
      clanTag={identity.tag}
      initials={identity.initials}
      badgeUrl={identity.badgeUrl}
      synced={identity.ok}
    />
  );
}
