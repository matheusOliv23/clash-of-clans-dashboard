"use client";

import { NavLinks } from "@/components/layout/nav-links";

export function Sidebar({
  clanName,
  clanTag,
}: {
  clanName: string;
  clanTag: string;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="px-5 py-5">
        <p className="text-sm font-semibold tracking-wide text-primary">
          ClanHub
        </p>
        <p className="text-xs text-sidebar-foreground/60">War Manager</p>
      </div>
      <NavLinks className="flex-1 px-3" />
      <p className="px-5 py-4 text-xs leading-5 text-sidebar-foreground/55">
        {clanName}
        <span className="mt-0.5 block font-mono">{clanTag}</span>
      </p>
    </aside>
  );
}
