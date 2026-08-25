"use client";

import AgTable from "@/components/ui/ag-table";
import { MemberColumn } from "../column/member";
import { useQuery } from "@tanstack/react-query";
import { getMembers } from "../actions/member-actions";
import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function MemberTable() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  const { data: membersData, isPending } = useQuery({
    queryKey: ["get-members", token],
    queryFn: async () => {
      if (!token) return { results: [] };
      return (await getMembers(token)) as { results: unknown[] };
    },
    enabled: !!token,
  });

  if (isPending) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  return (
    <AgTable
      rowData={(membersData?.results as Record<string, unknown>[]) || []}
      columnDefs={MemberColumn}
    />
  );
}
