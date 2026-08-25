import SubscriptionPlanTable from "@/modules/subscription-plan/components/subscription-plan-table";
import SidebarLayout from "@/components/layout/sidebar";
import { Suspense } from "react";
import { ButtonAddSubscriptionPlan } from "@/modules/subscription-plan/components/button-add-subscription-plan";

export default function SubscriptionPlansPage() {
  return (
     <SidebarLayout
          title="Daftar Plan Langganan"
          additionalComponents={
            <ButtonAddSubscriptionPlan />
          }
          breadcrumb={[{ name: "Admin" },{ name: "Subscription" },{ name: "Daftar Plan Langganan", path: "/admin/subscriptions/plans" }]}
        >
          <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
            <div className="flex flex-1 flex-col gap-4 h-[calc(100vh-12rem)] min-h-[500px]">
              <div className="flex-1 w-full">
                <SubscriptionPlanTable />
              </div>
            </div>
          </Suspense>
        </SidebarLayout>
  );
}
