import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  ShieldOff,
  ShieldCheck,
  ArrowUpCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { MemberActionModal } from "./member-action-modal";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { toast } from "sonner";
import { ICellRendererParams } from "ag-grid-community";
import { useBanMember, useRemoveMembership } from "../../_mutations/member";
import { useRevalidateQuery } from "@/hooks/use-revalidate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function MemberActionCell(params: ICellRendererParams) {
  const user = params.data;
  const revalidate = useRevalidateQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"promote" | "extend">("promote");
  const [alertType, setAlertType] = useState<"ban" | "revoke" | null>(null);
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";

  const isBanned = user.status === "Suspended";
  const isMember = user.role === "Member";
  const isLifetime =
    user.subscription_status === "Active" && !user.membership_end_date;

  const { mutate: banMember, isPending: banMemberPending } = useBanMember({
    onSuccess: () => {
      revalidate(["get-members"]);
      toast.success(`User berhasil di ${isBanned ? "unban" : "ban"}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    },
    accessToken: token,
  });

  const { mutate: removeMembership, isPending: removeMembershipPending } =
    useRemoveMembership({
      onSuccess: () => {
        // Kuota plan ikut dilepas saat revoke.
        revalidate(
          ["get-members"],
          ["get-subscription-plans"],
          ["get-public-pricing"],
        );
        toast.success("Keanggotaan berhasil dihapus");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Terjadi kesalahan",
        );
      },
      accessToken: token,
    });

  const handleAction = (type: "promote" | "extend") => {
    setActionType(type);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex h-full items-center justify-center">
        <AlertDialog>
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
                <AlertDialogTrigger disabled={removeMembershipPending} asChild>
                  <DropdownMenuItem 
                    className="text-orange-600"
                    onClick={() => setAlertType("revoke")}
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    <span>Hapus Keanggotaan</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              )}

              <AlertDialogTrigger disabled={banMemberPending} asChild>
                <DropdownMenuItem
                  className={isBanned ? "text-green-600" : "text-red-600"}
                  onClick={() => setAlertType("ban")}
                >
                  {isBanned ? (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Unban User</span>
                    </>
                  ) : (
                    <>
                      <ShieldOff className="mr-2 h-4 w-4" />
                      <span>Ban User</span>
                    </>
                  )}
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apakah anda yakin?</AlertDialogTitle>
              <AlertDialogDescription>
                {alertType === "revoke" ? (
                  <span>
                    Apakah Anda yakin ingin menghapus keanggotaan <span className="font-bold">{user.name}</span>? 
                    User akan kembali menjadi pengguna biasa dan langganan dibatalkan.
                  </span>
                ) : (
                  <span>
                    <span className="font-bold">{user.name}</span> akan{" "}
                    {isBanned
                      ? "diaktifkan kembali"
                      : "disuspend dan tidak dapat menggunakan aplikasi sampai anda mengaktifkan kembali"}
                    .
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={alertType === "revoke" || !isBanned ? "destructive" : "default"}
                onClick={() => {
                  if (alertType === "revoke") {
                    removeMembership({ userId: user.id, status: "" });
                  } else {
                    banMember({
                      userId: user.id,
                      status: isBanned ? "Active" : "Suspended",
                    });
                  }
                }}
              >
                {alertType === "revoke" 
                  ? "Hapus Keanggotaan" 
                  : isBanned ? "Aktifkan kembali" : "Suspend"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
