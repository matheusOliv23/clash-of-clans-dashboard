import { Suspense, type ReactNode } from "react";

import { LiveHeader, LiveSidebar } from "@/components/layout/live-chrome";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.08_152/0.22),transparent_62%)]"
      />
      <Suspense
        fallback={
          <div
            aria-hidden
            className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block"
          />
        }
      >
        <LiveSidebar />
      </Suspense>
      <div className="relative min-w-0 lg:pl-64">
        <Suspense
          fallback={
            <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3 lg:px-8">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
          }
        >
          <LiveHeader />
        </Suspense>
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
