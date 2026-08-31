import VoucherTable from "./_table/_components/voucher-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { ButtonAddVoucher } from "./_table/_components/button-add-voucher";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { queryVouchers } from "./_queries/voucher";

async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(queryVouchers(token));

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-1 flex-col gap-4">
        <div className="w-full flex-1">
          <VoucherTable />
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default async function VouchersPage({ params }: { params: Promise<{ panel: string }> }) {
  const { panel } = await params;
  return (
    <SidebarLayout
      title="Daftar Kode Voucher"
      additionalComponents={<ButtonAddVoucher />}
      breadcrumb={[
        { name: "Admin" },
        { name: "Subscription" },
        { name: "Kode Voucher", path: `/${panel}/subscriptions/vouchers` },
      ]}
    >
      <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
        <ServerSideData />
      </Suspense>
    </SidebarLayout>
  );
}
