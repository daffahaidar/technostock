import { SidebarDispatcher } from "@/components/layout/sidebar-dispatcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Fragment } from "react";
import ProductPlanTable from "@/modules/product-plan/components/product-plan-table";
import { getQueryClient } from "@/configs/tanstack-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getProductPlansByCategoryIdGrpc } from "@/modules/product-plan/actions/product-plan-actions";
import { connection } from "next/server";
import { getSession } from "@/app/auth/sign-in/_handlers/server";

async function PrefetchedTable({ categoryId }: { categoryId: string }) {
  await connection();
  
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["get-product-plan", categoryId],
    queryFn: async () => await getProductPlansByCategoryIdGrpc(categoryId),
  });

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
  const session = await getSession();
  const isAdmin = session?.user.role === "Admin";

  return (
    <Fragment>
      <SidebarDispatcher
        title="Plan Produk"
        breadcrumb={[
          { name: "Management" },
          { name: "Produk", path: "/admin/product" },
          { name: "Kategori", path: `/admin/product/category` },
          { name: "Plan" },
        ]}
        additionalComponents={
          isAdmin ? (
            <Button asChild>
              <Link href={`/admin/product/category/${category_id}/plan/add`}>
                Tambah Plan
              </Link>
            </Button>
          ) : null
        }
      />
      <PrefetchedTable categoryId={category_id} />
    </Fragment>
  );
}
