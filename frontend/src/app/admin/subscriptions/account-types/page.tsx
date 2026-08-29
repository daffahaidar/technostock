import AccountTypeTable from "./_table/_components/account-type-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { ButtonAddAccountType } from "./_table/_components/button-add-account-type";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/configs/tanstack-query";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { queryAccountTypes } from "./_queries/account-type";

async function ServerSideData() {
  const session = await getSession();
  const token = session?.session?.token || "";

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(queryAccountTypes(token));

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="flex h-[calc(100vh-12rem)] min-h-[500px] flex-1 flex-col gap-4">
        <div className="w-full flex-1">
          <AccountTypeTable />
        </div>
      </div>
    </HydrationBoundary>
  );
}

export default function AccountTypesPage() {
  return (
    <SidebarLayout
      title="Daftar Tipe Akun"
      additionalComponents={<ButtonAddAccountType />}
      breadcrumb={[
        { name: "Admin" },
        { name: "Subscription" },
        { name: "Daftar Tipe Akun", path: "/admin/subscriptions/account-types" },
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
