"use client";

import AgTable from "@/components/ui/ag-table";
import { SubscriptionPlanColumn } from "../_column/plan";
import { useGetPlanSubscription } from "../../_queries/plan";
import { Folder } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BeatLoader } from "react-spinners";

import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function SubscriptionPlanTable() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  const { planSubscriptionData, isPlanSubscriptionDataLoading } = useGetPlanSubscription(token || "");

  return (
    <AgTable
      stateId="plan-table"
      rowData={(planSubscriptionData?.results as Record<string, unknown>[]) || []}
      columnDefs={SubscriptionPlanColumn}
      loading={isPlanSubscriptionDataLoading}
      loadingOverlayComponent={()=>(
        <div className="flex flex-1 flex-col items-center justify-center">
          <BeatLoader color="var(--primary)" />
        </div>
      )}
      noRowsOverlayComponent={()=>(
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Folder />
            </EmptyMedia>
            <EmptyTitle>Belum Ada Plan Langganan</EmptyTitle>
            <EmptyDescription>
              Belum ada data plan langganan yang tersedia saat ini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    />
  );
}
