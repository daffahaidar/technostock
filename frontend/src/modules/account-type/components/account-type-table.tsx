"use client";

import AgTable from "@/components/ui/ag-table";
import { AccountTypeColumn } from "../column/account-type";
import { useQuery } from "@tanstack/react-query";
import { getAccountTypes } from "../actions/account-type-actions";

import { authClient } from "@/app/auth/sign-in/_handlers/client";

export default function AccountTypeTable() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  const { data: dataAccountType, isPending } = useQuery({
    queryKey: ["get-account-types", token],
    queryFn: async () => {
      if (!token) return { results: [] };
      return (await getAccountTypes(token)) as { results: unknown[] };
    },
    enabled: !!token,
  });

  if (isPending) {
    return <div className="flex h-64 items-center justify-center">Loading...</div>;
  }

  return (
    <AgTable
      rowData={dataAccountType?.results}
      columnDefs={AccountTypeColumn}
    />
  );
}
