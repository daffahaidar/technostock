"use client";

import AgTable from "@/components/ui/ag-table";
import { MemberColumn } from "../_column/member";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { useGetMembers } from "../../_queries/member";
import { Folder } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { BeatLoader } from "react-spinners";

export default function MemberTable() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token ||"";

  const { membersData, isMembersDataLoading } = useGetMembers(token);

  return (
    <AgTable
      rowData={membersData?.data || []}
      loading={isMembersDataLoading}
      columnDefs={MemberColumn}
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
            <EmptyTitle>No Projects Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any projects yet. Get started by creating
              your first project.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    />
  );
}
