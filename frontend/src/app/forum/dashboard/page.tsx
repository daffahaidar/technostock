"use cache";

import SidebarLayout from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  return (
    <SidebarLayout
      subSidebar={[
        { name: "Dashboard", path: "/forum/dashboard" },
        { name: "Users", path: "/admin/users" },
        { name: "Settings", path: "/admin/settings" },
      ]}
      title="Admin Dashboard"
      additionalComponents={
        <Button size={"sm"} className="bg-primary hover:bg-primary/90">
          Add User
        </Button>
      }
      breadcrumb={[{ name: "Admin", path: "/admin" }, { name: "Dashboard" }]}
    >
      Lorem ipsum dolor sit amet, consectetur adipisicing lorem1000
    </SidebarLayout>
  );
}
