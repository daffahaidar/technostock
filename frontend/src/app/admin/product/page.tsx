import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Button } from "@/components/ui/button";
import { Fragment } from "react";
import Link from "next/link";

export default function ProductPage() {
  return (
    <Fragment>
      <SidebarDispatcher
        title="Manajemen Produk"
        breadcrumb={[{ name: "Management" }, { name: "Produk" }]}
        subSidebar={[
          { name: "Daftar Produk", path: "/admin/product" },
          { name: "Kategori", path: "/admin/product/category" },
        ]}
        additionalComponents={
          <Button asChild>
            <Link href="/admin/product/add">Tambah Product</Link>
          </Button>
        }
      />
      <div>Konten ProductPage ada di sini</div>
    </Fragment>
  );
}
