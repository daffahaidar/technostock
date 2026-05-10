"use client";

import AgTable from "@/components/ui/ag-table";
import { ProductCategoryColumn } from "./product-column";
import { useQueryData } from "@/hooks/use-query";
import { golangBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export default function ProductCategoryTable() {
  const { data: dataCategory } = useQueryData({
    queryKey: ["get-product-categories"],
    endpoint: ENDPOINT.GOLANG_API.PRODUCT_CATEGORY,
    source: golangBackend,
  });

  return (
    <AgTable
      rowData={dataCategory?.results}
      columnDefs={ProductCategoryColumn}
    />
  );
}
