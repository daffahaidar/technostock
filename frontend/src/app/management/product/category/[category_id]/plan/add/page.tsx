import AddProductPlanForm from "@/app/management/product/_components/add-product-plan";
import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Fragment } from "react";

export default async function AddProductPlanPage({
  params,
}: {
  params: Promise<{ category_id: string }>;
}) {
  const { category_id } = await params;
  return (
    <Fragment>
      <SidebarDispatcher
        title="Tambah Plan Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/management/product" },
          { name: "Kategori", path: "/management/product/category" },
          { name: "Tambah Plan" },
        ]}
      />
      <AddProductPlanForm categoryId={category_id} />
    </Fragment>
  );
}
