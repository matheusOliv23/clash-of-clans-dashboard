import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { StatusBadge } from "@/components/data/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export function AppHeader({
  clanName,
  clanTag,
  initials,
  badgeUrl,
  synced,
}: {
  clanName: string;
  clanTag: string;
  initials: string;
  badgeUrl?: string;
  synced: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-8">
        <Suspense fallback={<Skeleton className="size-8 lg:hidden" />}>
          <MobileNav />
        </Suspense>
        <Avatar className="bg-primary/15 text-primary">
          {badgeUrl ? <AvatarImage src={badgeUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary/15 font-medium text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-primary">
            ClanHub
          </p>
          <p className="truncate text-sm">
            <span className="font-medium">{clanName}</span>
            <span className="font-mono text-muted-foreground">
              {" "}
              · {clanTag}
            </span>
          </p>
        </div>
        <StatusBadge
          tone={synced ? "em-guerra" : "nao-sincronizado"}
          label={synced ? "Ao vivo" : "Não sincronizado"}
          className="hidden shrink-0 sm:inline-flex"
        />
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <StatusBadge
          tone={synced ? "em-guerra" : "nao-sincronizado"}
          label={synced ? "Ao vivo" : "Não sincronizado"}
        />
      </div>
    </header>
  );
}
