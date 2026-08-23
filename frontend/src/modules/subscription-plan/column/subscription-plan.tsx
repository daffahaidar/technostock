"use client";

import { Button } from "@/components/ui/button";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { deleteSubscriptionPlan } from "../actions/subscription-plan-actions";
import { useMutation } from "@tanstack/react-query";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { toast } from "sonner";
import { Trash } from "lucide-react";

import { authClient } from "@/app/auth/sign-in/_handlers/client";

const ActionsRenderer = (props: ICellRendererParams) => {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (confirm("Are you sure you want to delete this subscription plan?")) {
        const token = sessionData?.session?.token;
        if (!token) throw new Error("Unauthorized");
        return await deleteSubscriptionPlan(props.data.id, token);
      }
      throw new Error("Cancelled");
    },
    onSuccess: () => {
      toast.success("Subscription plan deleted successfully");
      revalidate(["get-subscription-plans"]);
    },
    onError: (error: any) => {
      if (error.message !== "Cancelled") {
        toast.error(error?.message || "Failed to delete subscription plan");
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

export const SubscriptionPlanColumn: ColDef[] = [
  { field: "name", headerName: "Name" },
  { field: "account_type.name", headerName: "Account Type" },
  { field: "duration_months", headerName: "Duration (Months)" },
  { field: "price", headerName: "Price" },
  { field: "description", headerName: "Description" },
  {
    field: "actions",
    headerName: "Actions",
    cellRenderer: ActionsRenderer,
  },
];
