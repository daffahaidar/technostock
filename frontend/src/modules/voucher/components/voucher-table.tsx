"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { getVouchers, deleteVoucher } from "@/modules/voucher/actions/voucher-actions";
import { VoucherColumn } from "@/modules/voucher/column/voucher";
import { Button } from "@/components/ui/button";
import AgTable from "@/components/ui/ag-table";
import { toast } from "sonner";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import { Trash } from "lucide-react";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { ICellRendererParams } from "ag-grid-community";

export default function VoucherTable() {
  const revalidate = useRevalidateQuery();
  const { data: sessionData } = authClient.useSession();
  
  const { data} = useQuery({
    queryKey: ["get-vouchers", sessionData?.session?.token],
    queryFn: async () => {
      const token = sessionData?.session?.token;
      if (!token) return [];
      return await getVouchers(token);
    },
    enabled: !!sessionData?.session?.token,
  });

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const token = sessionData?.session?.token;
      if (!token) throw new Error("Unauthorized");
      return await deleteVoucher(id, token);
    },
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
        rowData={data || []}
        columnDefs={VoucherColumn}
        gridOptions={{
          components: {
            actionRenderer: ActionRenderer,
          },
        }}
      />
    </div>
  );
}
