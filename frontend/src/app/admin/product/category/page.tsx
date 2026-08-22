import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Button } from "@/components/ui/button";
import { Fragment, Suspense } from "react";

import Link from "next/link";
import ProductCategoryTable from "@/modules/product-category/components/product-category-table";
import { getQueryClient } from "@/configs/tanstack-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getProductCategoriesGrpc } from "@/modules/product-category/actions/product-category-actions";
import { connection } from "next/server";
import { getSession } from "@/app/auth/sign-in/_handlers/server";

async function PrefetchedTable() {
  // Opt out of static rendering
  await connection();
  
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["get-product-categories"],
    queryFn: async () => await getProductCategoriesGrpc(),
  });
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ProductCategoryTable />
    </HydrationBoundary>
  );
}

export default async function ProductCategoryPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "Admin";

  return (
    <Fragment>
      <SidebarDispatcher
        title="Kategori Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/admin/product" },
          { name: "Kategori" },
        ]}
        additionalComponents={
          isAdmin ? (
            <Button asChild>
              <Link href="/admin/product/category/add">Tambah Kategori</Link>
            </Button>
          ) : null
        }
      />
      <Suspense>
        <PrefetchedTable />
      </Suspense>
    </Fragment>
  );
}
