import AddAccountTypeForm from "@/modules/account-type/components/add-account-type";
import AccountTypeTable from "@/modules/account-type/components/account-type-table";
import { UserSquare } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";

export default function AccountTypesPage() {
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
              <BreadcrumbPage>Tipe Akun</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
          <UserSquare className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Tipe Akun</h1>
        </div>
        <p className="text-muted-foreground">
          Kelola tipe akun dan manfaat yang didapatkan oleh masing-masing tipe.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Tambah Tipe Akun</h2>
          <AddAccountTypeForm />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Daftar Tipe Akun</h2>
          <AccountTypeTable />
        </div>
      </div>
    </div>
  );
}
