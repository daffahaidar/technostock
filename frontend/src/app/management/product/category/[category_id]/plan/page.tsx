import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Fragment } from "react";
import ProductPlanTable from "../../../_components/product-plan-table";
import { getQueryClient } from "@/configs/tanstack-query";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { queryData } from "@/hooks/use-query";
import { ENDPOINT } from "@/endpoint";
import { golangBackend } from "@/libs/axios";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

async function PrefetchedTable({ categoryId }: { categoryId: string }) {
  const queryClient = getQueryClient();
  const session = await getSession();
  await queryClient.prefetchQuery(
    queryData({
      queryKey: ["get-product-plan", categoryId],
      endpoint: `${ENDPOINT.GOLANG_API.PRODUCT_PLAN}/category/${categoryId}`,
      source: golangBackend,
      token: session?.session.token,
    }),
  );
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <ProductPlanTable categoryId={categoryId} />
    </HydrationBoundary>
  );
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{ category_id: string }>;
}) {
  const { category_id } = await params;

  return (
    <Fragment>
      <SidebarDispatcher
        title="Plan Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/management/product" },
          { name: "Kategori", path: `/management/product/category` },
          { name: "Plan" },
        ]}
        additionalComponents={
          <Button asChild>
            <Link href={`/management/product/category/${category_id}/plan/add`}>
              Tambah Plan
            </Link>
          </Button>
        }
      />
      <PrefetchedTable categoryId={category_id} />
    </Fragment>
  );
}
