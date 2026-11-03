import {
  BarChart3,
  LayoutDashboard,
  Map,
  Settings,
  Shield,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href:
    | "/"
    | "/guerra"
    | "/war/map"
    | "/members"
    | "/members/guerra"
    | "/estatisticas"
    | "/configuracoes";
  label: string;
  icon: LucideIcon;
  hidden?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/guerra", label: "Guerra atual", icon: Swords },
  { href: "/war/map", label: "Mapa de guerra", icon: Map },
  { href: "/members", label: "Membros", icon: Users },
  {
    href: "/members/guerra",
    label: "Membros da Guerra",
    icon: Shield,
    hidden: true,
  },
  {
    href: "/estatisticas",
    label: "Estatísticas",
    icon: BarChart3,
    hidden: true,
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    hidden: true,
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
