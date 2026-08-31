import SidebarLayout from "@/components/layout/sidebar";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { queryActiveSubscription } from "@/app/admin/subscriptions/plans/_queries/active-subscription";
import { queryPublicPricing } from "@/app/admin/subscriptions/plans/_queries/public-pricing";
import DashboardSubscription from "./_components/dashboard-subscription";

async function ServerSideData() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const token = session.session?.token || "";

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.prefetchQuery(queryActiveSubscription(token)),
    queryClient.prefetchQuery(queryPublicPricing()),
  ]);

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">
          Halo,{" "}
          <span className="text-[#D4AF37]">
            {session.user.name || session.user.email}
          </span>
          !
        </h1>
        <DashboardSubscription role={session.user.role} />
      </div>
    </HydrationBoundary>
  );
}

export default function MemberDashboardPage() {
  return (
    <SidebarLayout
      breadcrumb={[{ name: "Forum", path: "/forum" }, { name: "Dashboard" }]}
    >
      <Suspense
        fallback={<div className="w-full text-white">Loading dashboard...</div>}
      >
        <ServerSideData />
      </Suspense>
    </SidebarLayout>
  );
}
