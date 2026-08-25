import { ColDef, ValueFormatterParams } from "ag-grid-community";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const VoucherColumn: ColDef[] = [
  { field: "code", headerName: "Kode Voucher" },
  { 
    field: "discount_percentage", 
    headerName: "Diskon (%)",
    valueFormatter: (params: ValueFormatterParams) => {
      return `${params.value}%`;
    }
  },
  {
    field: "max_discount_amount",
    headerName: "Maks. Potongan (Rp)",
    valueFormatter: (params: ValueFormatterParams) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(params.value);
    }
  },
  { 
    field: "expires_at", 
    headerName: "Kedaluwarsa",
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.value) return "-";
      return format(new Date(params.value), "dd MMM yyyy, HH:mm", { locale: id });
    }
  },
  {
    field: "quota",
    headerName: "Kuota",
    valueFormatter: (params: ValueFormatterParams) => {
      return params.value != null ? params.value.toString() : "∞";
    }
  },
  { field: "used_quota", headerName: "Terpakai" },
  {
    headerName: "Aksi",
    field: "id",
    cellRenderer: "actionRenderer",
    width: 120,
    sortable: false,
    filter: false,
  },
];
