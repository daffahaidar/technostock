"use client";

import SidebarLayout from "@/components/layout/sidebar";
import { useSidebarStore } from "@/store/use-sidebar-store";

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const { title, breadcrumb, subSidebar, additionalComponents } =
    useSidebarStore();

  return (
    <SidebarLayout
      title={title}
      breadcrumb={breadcrumb}
      subSidebar={subSidebar}
      additionalComponents={additionalComponents}
    >
      {children}
    </SidebarLayout>
  );
}
