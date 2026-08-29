import MemberTable from "./_table/_components/member-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { queryMembers } from "./_queries/member";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { queryPlanSubscription } from "../subscriptions/plans/_queries/plan";

async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(queryMembers(token)),
    queryClient.prefetchQuery(queryPlanSubscription(token)),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-1 flex-col gap-4">
        <div className="w-full flex-1">
          <MemberTable />
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default function MembersPage() {
  return (
    <SidebarLayout
      title="Daftar Member"
      breadcrumb={[
        { name: "Admin" },
        { name: "Member Management" },
        { name: "Daftar Member", path: "/admin/members" },
      ]}
    >
      <Suspense
        fallback={<div className="w-full text-white">Loading dashboard...</div>}
      >
        <ServerSideData />
      </Suspense>
    </SidebarLayout>
  );
}
