import AccountTypeTable from "@/modules/account-type/components/account-type-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { ButtonAddAccountType } from "@/modules/account-type/components/button-add-account-type";

export default function AccountTypesPage() {
  return (
     <SidebarLayout
          title="Daftar Tipe Akun"
          additionalComponents={
            <ButtonAddAccountType />
          }
          breadcrumb={[{ name: "Admin" },{ name: "Subscription" },{ name: "Daftar Tipe Akun", path: "/admin/subscriptions/account-types" }]}
        >
          <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
            <div className="flex flex-1 flex-col gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
              <div className="flex-1 w-full">
                <AccountTypeTable />
              </div>
            </div>
          </Suspense>
        </SidebarLayout>
   
     
  
  );
}
