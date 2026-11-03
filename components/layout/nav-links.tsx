"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isActivePath, navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

function activeHref(pathname: string): string | null {
  return (
    navItems
      .filter((item) => isActivePath(pathname, item.href))
      .sort((left, right) => right.href.length - left.href.length)[0]?.href ??
    null
  );
}

export function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={className} aria-label="Seções">
      <ul className="flex flex-col gap-1">
        {navItems
          .filter((item) => !item.hidden)
          .map((item) => {
            const active = item.href === activeHref(pathname);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active &&
                      "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]",
                  )}
                >
                  <Icon
                    className={cn("size-4", active && "text-primary")}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
