"use client";

import AgTable from "@/components/ui/ag-table";
import { SubscriptionPlanColumn } from "../column/subscription-plan";
import { useQuery } from "@tanstack/react-query";
import { getSubscriptionPlans } from "../actions/subscription-plan-actions";

import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function SubscriptionPlanTable() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  const { data: dataSubscriptionPlan, isPending } = useQuery({
    queryKey: ["get-subscription-plans", token],
    queryFn: async () => {
      if (!token) return { results: [] };
      return (await getSubscriptionPlans(token)) as { results: unknown[] };
    },
    enabled: !!token,
  });

  if (isPending) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  return (
    <AgTable
      rowData={(dataSubscriptionPlan?.results as Record<string, unknown>[]) || []}
      columnDefs={SubscriptionPlanColumn}
    />
  );
}
