import VoucherTable from "@/modules/voucher/components/voucher-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { ButtonAddVoucher } from "@/modules/voucher/components/button-add-voucher";

export default function VouchersPage() {
  return (
    <SidebarLayout
      title="Daftar Kode Voucher"
      additionalComponents={<ButtonAddVoucher />}
      breadcrumb={[
        { name: "Admin" },
        { name: "Subscription" },
        { name: "Kode Voucher", path: "/admin/subscriptions/vouchers" },
      ]}
    >
      <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
        <div className="flex flex-1 flex-col gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="flex-1 w-full">
            <VoucherTable />
          </div>
        </div>
      </Suspense>
    </SidebarLayout>
  );
}
