import SubscriptionPlanTable from "./_table/_components/plan-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { ButtonAddSubscriptionPlan } from "./_table/_components/button-add-plan";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { queryPlanSubscription } from "./_queries/plan";

async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(queryPlanSubscription(token));

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-1 flex-col gap-4">
        <div className="w-full flex-1">
          <SubscriptionPlanTable />
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default function SubscriptionPlansPage() {
  return (
    <SidebarLayout
      title="Daftar Plan Langganan"
      additionalComponents={<ButtonAddSubscriptionPlan />}
      breadcrumb={[
        { name: "Admin" },
        { name: "Subscription" },
        { name: "Daftar Plan Langganan", path: "/admin/subscriptions/plans" },
      ]}
    >
      <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
        <ServerSideData />
      </Suspense>
    </SidebarLayout>
  );
}
