"use client";

import { Button } from "@/components/ui/button";
import { ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import { useDeletePlan } from "../../_mutations/plan";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { authClient } from "@/app/auth/sign-in/_handlers/client";

const ActionsRenderer = (props: ICellRendererParams) => {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const userCount = props.data.user_count || 0;

  const token = sessionData?.session?.token || "";

  const { mutate, isPending } = useDeletePlan({
    accessToken: token,
    onSuccess: () => {
      toast.success("Subscription plan deleted successfully");
      revalidate(["get-subscription-plans"]);
    },
    onError: (error: unknown) => {
      if ((error as Error).message !== "Cancelled") {
        toast.error((error as Error)?.message || "Failed to delete subscription plan");
      }
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this subscription plan?")) {
      mutate(props.data.id);
    }
  };

  const isDeleteDisabled = userCount > 0 || isPending;

  return (
    <div className="flex gap-2 items-center h-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={isDeleteDisabled ? "cursor-not-allowed" : ""}>
              <Button 
                size="xs" 
                className="h-auto py-1 bg-transparent border border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400 disabled:opacity-50 disabled:pointer-events-none"
                onClick={handleDelete} 
                disabled={isDeleteDisabled}
              >
                <Trash className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            </span>
          </TooltipTrigger>
          {userCount > 0 && (
            <TooltipContent hideArrow={true} className="bg-[#111] border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-medium shadow-md shadow-[#D4AF37]/5">
              <p>Tidak dapat dihapus: Masih ada {userCount} user dengan subscription aktif.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export const SubscriptionPlanColumn: ColDef[] = [
  { field: "name", headerName: "Nama Plan" },
  { field: "account_type.name", headerName: "Tipe Akun" },
  { 
    field: "duration_months", 
    headerName: "Durasi (Bulan)",
    valueFormatter: (params: ValueFormatterParams) => {
      return params.value === 0 ? "Lifetime" : `${params.value} Bulan`;
    }
  },
  { 
    field: "price", 
    headerName: "Harga",
    valueFormatter: (params: ValueFormatterParams) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(params.value);
    }
  },
  { field: "user_count", headerName: "Jumlah Member" },
  {
    field: "quota",
    headerName: "Kuota",
    valueFormatter: (params: ValueFormatterParams) => {
      return (params.data.duration_months === 0 && params.data.quota != null) ? params.data.quota.toString() : "∞";
    }
  },
  { field: "description", headerName: "Deskripsi", flex: 1 },
  {
    headerName: "Aksi",
    cellRenderer: ActionsRenderer,
  },
];
