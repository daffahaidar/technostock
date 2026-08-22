"use client";

import AgTable from "@/components/ui/ag-table";
import { ProductCategoryColumn } from "../column/product-category";
import { useQuery } from "@tanstack/react-query";
import { getProductCategoriesGrpc } from "../actions/product-category-actions";

export default function ProductCategoryTable() {
  const { data: dataCategory } = useQuery({
    queryKey: ["get-product-categories"],
    queryFn: async () =>
      (await getProductCategoriesGrpc()) as { results: any[] },
  });

  return (
    <AgTable
      rowData={dataCategory?.results || []}
      columnDefs={ProductCategoryColumn}
    />
  );
}
