"use client";

import AgTable from "@/components/ui/ag-table";
import { AccountTypeColumn } from "../_column/account-type";
import { useGetAccountTypes } from "../../_queries/account-type";
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

export default function AccountTypeTable() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  const { accountTypesData, isAccountTypesDataLoading } = useGetAccountTypes(token || "");

  return (
    <AgTable
      stateId="account-type-table"
      rowData={(accountTypesData?.results as Record<string, unknown>[]) || []}
      columnDefs={AccountTypeColumn}
      loading={isAccountTypesDataLoading}
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
            <EmptyTitle>Belum Ada Tipe Akun</EmptyTitle>
            <EmptyDescription>
              Belum ada data tipe akun yang tersedia saat ini.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    />
  );
}
