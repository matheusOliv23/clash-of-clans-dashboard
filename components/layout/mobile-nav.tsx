"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { NavLinks } from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir navegação"
        >
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle>ClanHub</SheetTitle>
          <SheetDescription>Navegação do War Manager</SheetDescription>
        </SheetHeader>
        <NavLinks className="px-3 py-3" onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
