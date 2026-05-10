"use client";

import { Button } from "@/components/ui/button";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import Link from "next/link";

export const ProductCategoryColumn: ColDef[] = [
  { field: "name", headerName: "Nama Kategori" },
  { field: "description", headerName: "Deskripsi" },
  { field: "updated_at", headerName: "Terakhir Diperbarui" },
  {
    field: "actions",
    headerName: "Aksi",
    cellRenderer: (props: ICellRendererParams) => (
      <Button size={"xs"} asChild>
        <Link href={`/management/product/category/${props.data?.id}/plan`}>
          Manage Plans
        </Link>
      </Button>
    ),
  },
];

export const ProductPlanColumn: ColDef[] = [
  { field: "name", headerName: "Nama Plan" },
  { field: "description", headerName: "Deskripsi" },
  { field: "price", headerName: "Harga" },
  {
    field: "actions",
    headerName: "Aksi",
    cellRenderer: (props: ICellRendererParams) => (
      <Button size={"xs"} asChild>
        <Link
          href={`/management/product/category/${props.data?.category_id}/plan/edit/${props.data?.id}`}
        >
          Edit Plan
        </Link>
      </Button>
    ),
  },
];
