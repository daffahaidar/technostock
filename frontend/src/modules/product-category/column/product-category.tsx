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
        <Link href={`/admin/product/category/${props.data?.id}/plan`}>
          Manage Plans
        </Link>
      </Button>
    ),
  },
];
