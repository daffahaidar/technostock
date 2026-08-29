"use client";

import { Button } from "@/components/ui/button";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { Trash } from "lucide-react";

import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { revalidateServerTag } from "@/actions/revalidate";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateAccountType, useDeleteAccountType } from "../../_mutations/account-type";

const ActionsRenderer = (props: ICellRendererParams) => {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const userCount = props.data.user_count || 0;
  const token = sessionData?.session?.token || "";
  
  const { mutate, isPending } = useDeleteAccountType({
    accessToken: token,
    onSuccess: () => {
      toast.success("Account type deleted successfully");
      revalidate(["get-account-types"]);
    },
    onError: (error: unknown) => {
      if ((error as Error).message !== "Cancelled") {
        toast.error((error as Error)?.message || "Failed to delete account type");
      }
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this account type? This will also delete all associated subscription plans.")) {
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
                <Trash className="w-3.5 h-3.5" />
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



const RecommendedRenderer = (props: ICellRendererParams) => {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";

  const { mutate, isPending } = useUpdateAccountType({
    accessToken: token,
    onSuccess: async () => {
      toast.success("Account type recommendation updated");
      revalidate(["get-account-types"]);
      await revalidateServerTag("public-account-types");
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Failed to update recommendation");
    },
  });

  return (
    <div className="flex items-center h-full">
      <Checkbox 
        checked={props.data.is_recommended} 
        onCheckedChange={(checked) => mutate({ id: props.data.id, is_recommended: !!checked })}
        disabled={isPending}
      />
    </div>
  );
};

const BenefitsRenderer = (props: ICellRendererParams) => {
  let benefits: string[] = [];
  try {
    benefits = typeof props.value === "string" ? JSON.parse(props.value) : props.value;
    if (!Array.isArray(benefits)) {
      benefits = [String(benefits)];
    }
  } catch {
    if (props.value) {
      benefits = [String(props.value)];
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center py-3">
      {benefits.map((benefit, i) => (
        <Badge key={i} variant="secondary" className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border-none">
          {benefit}
        </Badge>
      ))}
    </div>
  );
};

export const AccountTypeColumn: ColDef[] = [
  { field: "name", headerName: "Tipe Akun" },
  { field: "description", headerName: "Deskripsi", flex: 1 },
  { field: "user_count", headerName: "Jumlah Member" },
  { 
    field: "benefits", 
    headerName: "Benefit",
    cellRenderer: BenefitsRenderer,
    flex: 1,
    autoHeight: true
  },
  {
    field: "is_recommended",
    headerName: "Recommended",
    cellRenderer: RecommendedRenderer,
  },
  {
    headerName: "Aksi",
    cellRenderer: ActionsRenderer,
  },
];
