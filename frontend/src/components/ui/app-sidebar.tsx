"use client";
import { Suspense } from "react";
import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react";
import { ListMenu } from "@/components/ui/list-menu";
import { NavUser } from "@/components/ui/nav-user";
import { RoleSwitcher } from "./role-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import mainMenu from "@/constants/main-menu";
import profileMenu from "@/constants/profile-menu";

const data = {
  roles: [
    {
      name: "Technorider",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

import { GlobalNotificationHandler } from "@/components/context/global-notification-handler";
import managementMenu from "@/constants/management-menu";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  menu: "main" | "profile" | "management";
}

export function AppSidebar({ menu, ...props }: AppSidebarProps) {
  const activeMenu =
    menu === "profile"
      ? profileMenu
      : menu === "management"
        ? managementMenu
        : mainMenu;

  return (
    <>
      <Suspense fallback={null}>
        <GlobalNotificationHandler />
      </Suspense>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <RoleSwitcher roles={data.roles} />
        </SidebarHeader>
        <SidebarContent>
          {activeMenu.map((listMenu, index) => (
            <ListMenu
              group={listMenu.group}
              menus={listMenu.menus}
              key={index}
            />
          ))}
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
