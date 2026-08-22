import AddProductPlanForm from "@/modules/product-plan/components/add-product-plan";
import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Fragment } from "react";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { redirect } from "next/navigation";

export default async function AddProductPlanPage({
  params,
}: {
  params: Promise<{ category_id: string }>;
}) {
  const session = await getSession();
  const { category_id } = await params;
  
  if (session?.user.role !== "Admin") {
    redirect(`/admin/product/category/${category_id}/plan`);
  }

  return (
    <Fragment>
      <SidebarDispatcher
        title="Tambah Plan Produk"
        breadcrumb={[
          { name: "Admin" },
          { name: "Produk", path: "/admin/product" },
          { name: "Kategori", path: "/admin/product/category" },
          { name: "Plan", path: `/admin/product/category/${category_id}/plan` },
        ]}
      />
      <AddProductPlanForm categoryId={category_id} />
    </Fragment>
  );
}
