"use client";

import { Button } from "@/components/ui/button";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useMutation } from "@tanstack/react-query";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { Trash } from "lucide-react";

import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { revalidateServerTag } from "@/app/actions/revalidate";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { updateAccountType, deleteAccountType } from "../actions/account-type-actions";

const ActionsRenderer = (props: ICellRendererParams) => {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (confirm("Are you sure you want to delete this account type?")) {
        const token = sessionData?.session?.token;
        if (!token) throw new Error("Unauthorized");
        return await deleteAccountType(props.data.id, token);
      }
      throw new Error("Cancelled");
    },
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

  return (
    <div className="flex gap-2 items-center h-full">
      <Button 
        size="xs" 
        className="bg-transparent border border-red-900 text-red-500 hover:bg-red-950 hover:text-red-400"
        onClick={() => mutate()} 
        disabled={isPending}
      >
        <Trash className="w-4 h-4 mr-1" />
        Delete
      </Button>
    </div>
  );
};



const RecommendedRenderer = (props: ICellRendererParams) => {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();

  const { mutate, isPending } = useMutation({
    mutationFn: async (checked: boolean) => {
      const token = sessionData?.session?.token;
      if (!token) throw new Error("Unauthorized");
      return await updateAccountType(props.data.id, { is_recommended: checked }, token);
    },
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
        onCheckedChange={(checked) => mutate(!!checked)}
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
  } catch (e) {
    if (props.value) {
      benefits = [String(props.value)];
    }
  }

  return (
    <div className="flex flex-wrap gap-1 items-center h-full content-center py-2">
      {benefits.map((benefit, i) => (
        <Badge key={i} variant="secondary" className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border-none">
          {benefit}
        </Badge>
      ))}
    </div>
  );
};

export const AccountTypeColumn: ColDef[] = [
  { field: "name", headerName: "Name" },
  { field: "description", headerName: "Description", flex: 1 },
  { 
    field: "benefits", 
    headerName: "Benefits",
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
    field: "actions",
    headerName: "Actions",
    cellRenderer: ActionsRenderer,
  },
];
