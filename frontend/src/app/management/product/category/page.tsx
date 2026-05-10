import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Button } from "@/components/ui/button";
import { Fragment, Suspense } from "react";

import Link from "next/link";
import ProductCategoryTable from "../_components/product-category-table";
import { getQueryClient } from "@/configs/tanstack-query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { queryData } from "@/hooks/use-query";
import { golangBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

import { getSession } from "@/app/auth/sign-in/_handlers/server";

async function PrefetchedTable() {
  const queryClient = getQueryClient();
  const session = await getSession();
  await queryClient.prefetchQuery(
    queryData({
      queryKey: ["get-product-categories"],
      endpoint: ENDPOINT.GOLANG_API.PRODUCT_CATEGORY,
      source: golangBackend,
      token: session?.session.token,
    }),
  );
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ProductCategoryTable />
    </HydrationBoundary>
  );
}

export default function ProductCategoryPage() {
  return (
    <Fragment>
      <SidebarDispatcher
        title="Kategori Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/management/product" },
          { name: "Kategori" },
        ]}
        additionalComponents={
          <Button asChild>
            <Link href="/management/product/category/add">Tambah Kategori</Link>
          </Button>
        }
      />
      <Suspense>
        <PrefetchedTable />
      </Suspense>
    </Fragment>
  );
}
