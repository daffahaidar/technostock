import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LayoutClient } from "../../components/context/layout-client";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar menu="profile" />
      <LayoutClient>{children}</LayoutClient>
    </SidebarProvider>
  );
}
