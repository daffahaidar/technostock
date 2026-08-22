"use client";

import AgTable from "@/components/ui/ag-table";
import { ProductPlanColumn } from "@/modules/product-plan/column/product-plan";
import { useQuery } from "@tanstack/react-query";
import { getProductPlansByCategoryIdGrpc } from "../actions/product-plan-actions";

export default function ProductPlanTable({
  categoryId,
}: {
  categoryId: string;
}) {
  const { data: dataPlan } = useQuery({
    queryKey: ["get-product-plan", categoryId],
    queryFn: async () =>
      (await getProductPlansByCategoryIdGrpc(categoryId)) as { results: any[] },
  });

  return <AgTable rowData={dataPlan?.results || []} columnDefs={ProductPlanColumn} />;
}
