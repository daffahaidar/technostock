import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LayoutClient } from "../../components/context/layout-client";
import { Suspense } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar menu="management" />
      <Suspense fallback={null}>
        <LayoutClient>{children}</LayoutClient>
      </Suspense>
    </SidebarProvider>
  );
}
