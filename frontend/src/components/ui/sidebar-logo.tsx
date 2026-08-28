"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SidebarLogo({
  roleLabel,
  logo: Logo,
}: {
  roleLabel: string;
  logo: React.ElementType;
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="hover:bg-transparent hover:text-inherit pointer-events-none">
          <div className="bg-gradient-gold text-black flex aspect-square size-8 items-center justify-center rounded-lg">
            <Logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-gradient-gold text-base">AngelTrade</span>
            <span className="truncate text-xs text-gray-400">{roleLabel}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
