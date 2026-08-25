import MemberTable from "@/modules/member/components/member-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";

export default function MembersPage() {
  return (
     <SidebarLayout
          title="Daftar Member"
          breadcrumb={[{ name: "Admin" },{ name: "Member Management" },{ name: "Daftar Member", path: "/admin/members" }]}
        >
          <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
            <div className="flex flex-1 flex-col gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
              <div className="flex-1 w-full">
                <MemberTable />
              </div>
            </div>
          </Suspense>
        </SidebarLayout>
  );
}
