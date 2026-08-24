"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Fragment } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useNotificationStore } from "@/store/useNotificationStore";
import { Badge } from "./badge";
import useMounted from "@/hooks/use-mounted";

export function ListMenu({
  group,
  menus,
}: {
  group: string;
  menus: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { state } = useSidebar();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { isMounted } = useMounted();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group}</SidebarGroupLabel>
      <SidebarMenu>
        {menus.map((item) => {
          const isDiscussion = item.title === "Member Discussion";
          return (
            <Fragment key={item.title}>
              {item.items ? (
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      {state === "collapsed" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton tooltip={item.title}>
                              {item.icon && <item.icon />}
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side="right"
                            align="start"
                            sideOffset={4}
                          >
                            <DropdownMenuLabel className="p-0 font-normal">
                              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                {item.icon && <item.icon />}
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                  <span className="truncate text-xs">
                                    {group}
                                  </span>
                                  <span className="truncate font-medium">
                                    {item.title}
                                  </span>
                                </div>
                              </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              {item.items?.map((subItem, index) => (
                                <DropdownMenuItem key={index} asChild>
                                  <Link href={subItem.url}>
                                    {subItem.title}
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="flex w-full items-center"
                    isActive={item.isActive}
                  >
                    <Link href={item.url} className="flex w-full items-center">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {isDiscussion && isMounted && unreadCount > 0 && (
                        <div className="flex flex-1 justify-end">
                          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </Badge>
                        </div>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </Fragment>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
