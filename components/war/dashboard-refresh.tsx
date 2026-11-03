"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function DashboardRefresh({ intervalMs }: { intervalMs: number }) {
  const router = useRouter();

  useEffect(() => {
    let pending = false;
    const id = window.setInterval(() => {
      if (pending) {
        return;
      }

      pending = true;
      router.refresh();
      window.setTimeout(() => {
        pending = false;
      }, 2_000);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
