import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { queryMidtransBalance } from "./_queries/finances";
import { getSession } from "@/app/auth/sign-in/_handlers/server";

export const instant = false;

import { notFound } from "next/navigation";
import FinanceReport from "./_components/finance-report";

async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(queryMidtransBalance(token));

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <FinanceReport />
    </HydrationBoundary>
  );
}

export default async function FinancesPage({ params }: { params: Promise<{ panel: string }> }) {
  const { panel } = await params;
  const session = await getSession();
  const role = session?.user?.role;

  // Hanya Owner yang boleh mengakses fitur ini
  if (role !== "Owner") {
    notFound();
  }

  return (
    <SidebarLayout
      title="Financial Reports"
      breadcrumb={[
        { name: "Management" },
        { name: "Finances" },
        { name: "Financial Reports", path: `/${panel}/finances/reports` },
      ]}
    >
      <Suspense
        fallback={<div className="w-full text-white">Loading reports...</div>}
      >
        <ServerSideData />
      </Suspense>
    </SidebarLayout>
  );
}
