import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Fragment } from "react";
import AddProductCategoryForm from "../../_components/add-product-category";

export default function AddProductCategoryPage() {
  return (
    <Fragment>
      <SidebarDispatcher
        title="Tambah Kategori Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/management/product" },
          { name: "Kategori", path: "/management/product/category" },
          { name: "Tambah Kategori" },
        ]}
      />
      <AddProductCategoryForm />
    </Fragment>
  );
}
