"use client";

import { useEffect } from "react";
import { useSidebarStore } from "@/store/use-sidebar-store";

interface NavigationItem {
  name: string;
  path?: string;
}

interface SidebarDispatcherProps {
  title?: string;
  breadcrumb?: NavigationItem[];
  subSidebar?: NavigationItem[];
  additionalComponents?: React.ReactNode;
}

export function SidebarDispatcher({
  title,
  breadcrumb,
  subSidebar,
  additionalComponents,
}: SidebarDispatcherProps) {
  const setSidebarData = useSidebarStore((state) => state.setSidebarData);

  // We use stringified versions for deep comparison of arrays/objects
  // to avoid infinite loops in useEffect if they are passed inline.
  const serializedBreadcrumb = JSON.stringify(breadcrumb);
  const serializedSubSidebar = JSON.stringify(subSidebar);

  useEffect(() => {
    setSidebarData({
      title,
      breadcrumb,
      subSidebar,
      additionalComponents,
    });

    return () => {
      // Optional cleanup if you want the layout to reset when navigating away
      // We comment it out so navigating between pages doesn't flicker empty layout
      // setSidebarData({
      //   title: undefined,
      //   breadcrumb: undefined,
      //   subSidebar: undefined,
      //   additionalComponents: undefined,
      // });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    serializedBreadcrumb,
    serializedSubSidebar,
    additionalComponents,
    setSidebarData,
  ]);

  return null;
}
