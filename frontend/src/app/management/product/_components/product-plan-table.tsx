"use client";

import AgTable from "@/components/ui/ag-table";
import { ProductPlanColumn } from "./product-column";
import { useQueryData } from "@/hooks/use-query";
import { golangBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export default function ProductPlanTable({
  categoryId,
}: {
  categoryId: string;
}) {
  const { data: dataPlan } = useQueryData({
    queryKey: ["get-product-plan", categoryId],
    endpoint: `${ENDPOINT.GOLANG_API.PRODUCT_PLAN}/category/${categoryId}`,
    source: golangBackend,
  });

  return <AgTable rowData={dataPlan?.results} columnDefs={ProductPlanColumn} />;
}
