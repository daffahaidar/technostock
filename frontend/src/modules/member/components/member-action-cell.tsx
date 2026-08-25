import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldOff, ShieldCheck, ArrowUpCircle, Clock } from "lucide-react";
import { useState } from "react";
import { MemberActionModal } from "./member-action-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserStatus, revokeMembership } from "../actions/member-actions";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { toast } from "sonner";
import { ICellRendererParams } from "ag-grid-community";

export function MemberActionCell(params: ICellRendererParams) {
  const user = params.data;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"promote" | "extend">("promote");
  const queryClient = useQueryClient();
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  const isBanned = user.status === "Suspended";
  const isMember = user.role === "Member";
  const isLifetime = user.subscription_status === "Active" && !user.membership_end_date;

  const statusMutation = useMutation({
    mutationFn: async (newStatus: "Active" | "Suspended") => {
      if (!token) throw new Error("No token");
      return await updateUserStatus(user.id, newStatus, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-members"] });
      toast.success(`User berhasil di ${isBanned ? "unban" : "ban"}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    },
  });

  const handleStatusToggle = () => {
    if (confirm(`Apakah Anda yakin ingin ${isBanned ? "mengaktifkan kembali" : "suspend/ban"} user ini?`)) {
      statusMutation.mutate(isBanned ? "Active" : "Suspended");
    }
  };

  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No token");
      return await revokeMembership(user.id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-members"] });
      toast.success("Keanggotaan berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    },
  });

  const handleRevoke = () => {
    if (confirm("Apakah Anda yakin ingin menghapus keanggotaan user ini? User akan kembali menjadi pengguna biasa dan langganan dibatalkan.")) {
      revokeMutation.mutate();
    }
  };

  const handleAction = (type: "promote" | "extend") => {
    setActionType(type);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex justify-center items-center h-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isMember && (
              <DropdownMenuItem onClick={() => handleAction("promote")}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                <span>Promote to Member</span>
              </DropdownMenuItem>
            )}
            
            {isMember && !isLifetime && (
              <DropdownMenuItem onClick={() => handleAction("extend")}>
                <Clock className="mr-2 h-4 w-4" />
                <span>Extend Subscription</span>
              </DropdownMenuItem>
            )}

            {isMember && isLifetime && (
              <DropdownMenuItem onClick={() => handleAction("extend")}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                <span>Ubah Paket Lifetime</span>
              </DropdownMenuItem>
            )}

            {isMember && (
              <DropdownMenuItem 
                onClick={handleRevoke}
                className="text-orange-600"
                disabled={revokeMutation.isPending}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                <span>Hapus Keanggotaan</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem 
              onClick={handleStatusToggle}
              className={isBanned ? "text-green-600" : "text-red-600"}
              disabled={statusMutation.isPending}
            >
              {isBanned ? (
                <><ShieldCheck className="mr-2 h-4 w-4" /><span>Unban User</span></>
              ) : (
                <><ShieldOff className="mr-2 h-4 w-4" /><span>Ban User</span></>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MemberActionModal 
        userId={user.id} 
        actionType={actionType} 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        isLifetime={isLifetime}
        discordUsername={user.discord_username}
      />
    </>
  );
}
