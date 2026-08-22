import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Fragment } from "react";
import AddProductCategoryForm from "@/modules/product-category/components/add-product-category";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { redirect } from "next/navigation";

export default async function AddProductCategoryPage() {
  const session = await getSession();
  if (session?.user.role !== "Admin") {
    redirect("/admin/product/category");
  }

  return (
    <Fragment>
      <SidebarDispatcher
        title="Tambah Kategori Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/admin/product" },
          { name: "Kategori", path: "/admin/product/category" },
          { name: "Tambah Kategori" },
        ]}
      />
      <AddProductCategoryForm />
    </Fragment>
  );
}
