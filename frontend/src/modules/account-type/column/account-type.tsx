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
    onError: (error: any) => {
      if (error.message !== "Cancelled") {
        toast.error(error?.message || "Failed to delete account type");
      }
    },
  });

  return (
    <div className="flex gap-2 items-center h-full">
      <Button 
        size="xs" 
        variant="destructive" 
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
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update recommendation");
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

export const AccountTypeColumn: ColDef[] = [
  { field: "name", headerName: "Name" },
  { field: "description", headerName: "Description" },
  { field: "benefits", headerName: "Benefits" },
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
