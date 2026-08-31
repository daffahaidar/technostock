import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ panel: "admin" }, { panel: "management" }];
}

export default async function PanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ panel: string }>;
}) {
  const { panel } = await params;
  
  if (panel !== "admin" && panel !== "management") {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar menu={panel as "admin" | "management"} />
      {children}
    </SidebarProvider>
  );
}
