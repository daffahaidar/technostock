"use client";

import { useGetVouchers } from "../../_queries/voucher";
import { useDeleteVoucher } from "../../_mutations/voucher";
import { VoucherColumn } from "../_column/voucher";
import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BeatLoader } from "react-spinners";
import AgTable from "@/components/ui/ag-table";
import { toast } from "sonner";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { Trash } from "lucide-react";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { ICellRendererParams } from "ag-grid-community";

export default function VoucherTable() {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";
  
  const { vouchersData: data, isVouchersDataLoading } = useGetVouchers(token);

  const { mutate: doDelete, isPending: isDeleting } = useDeleteVoucher({
    accessToken: token,
    onSuccess: () => {
      toast.success("Voucher berhasil dihapus");
      revalidate(["get-vouchers"]);
    },
    onError: (error: unknown) => {
      toast.error((error as Error)?.message || "Gagal menghapus voucher");
    },
  });


  const ActionRenderer = (params: ICellRendererParams) => {
    return (
      <Button
        variant="destructive"
        size="icon"
        className="h-8 w-8 mt-1"
        disabled={isDeleting}
        onClick={() => {
          if (confirm("Apakah anda yakin ingin menghapus voucher ini?")) {
            doDelete(params.value);
          }
        }}
      >
        <Trash className="h-4 w-4" />
      </Button>
    );
  };

  return (
    <div className="size-full">
      <AgTable
        rowData={data?.results || []}
        columnDefs={VoucherColumn}
        loading={isVouchersDataLoading}
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
              <EmptyTitle>Belum Ada Kode Voucher</EmptyTitle>
              <EmptyDescription>
                Belum ada data kode voucher yang tersedia saat ini.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        gridOptions={{
          components: {
            actionRenderer: ActionRenderer,
          },
        }}
      />
    </div>
  );
}
