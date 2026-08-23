import AddSubscriptionPlanForm from "@/modules/subscription-plan/components/add-subscription-plan";
import SubscriptionPlanTable from "@/modules/subscription-plan/components/subscription-plan-table";
import { Layers } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default function SubscriptionPlansPage() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Plan Langganan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Plan Langganan</h1>
        </div>
        <p className="text-muted-foreground">
          Kelola plan langganan dan harga untuk masing-masing tipe akun.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Tambah Plan</h2>
          <AddSubscriptionPlanForm />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Daftar Plan</h2>
          <SubscriptionPlanTable />
        </div>
      </div>
    </div>
  );
}
