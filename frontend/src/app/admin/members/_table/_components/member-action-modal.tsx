import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetPlanSubscription } from "@/app/admin/subscriptions/plans/_queries/plan";
import { Loader2 } from "lucide-react";
import { useExtendMembership, usePromoteMember } from "../../_mutations/member";
import { useRevalidateQuery } from "@/hooks/use-revalidate";

interface ActionModalProps {
  userId: string;
  actionType: "promote" | "extend";
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isLifetime?: boolean;
  discordUsername?: string;
}

export function MemberActionModal({
  userId,
  actionType,
  isOpen,
  setIsOpen,
  isLifetime,
  discordUsername: initialDiscordUsername,
}: ActionModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [discordUsername, setDiscordUsername] = useState(
    initialDiscordUsername || "",
  );
  const revalidate = useRevalidateQuery();
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDiscordUsername(initialDiscordUsername || "");
      setSelectedPlanId("");
    }
  }

  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";

  const { planSubscriptionData, isPlanSubscriptionDataLoading } =
    useGetPlanSubscription(token);

  const { mutate: promoteMember, isPending: isPromoteMemberPending } =
    usePromoteMember({
      onSuccess: () => {
        revalidate(["get-members"]);
        setIsOpen(false);
        setSelectedPlanId("");
        toast.success("Berhasil mempromosikan member");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Terjadi kesalahan",
        );
      },
      accessToken: token,
    });

  const { mutate: extendMembership, isPending: isExtendMembershipPending } =
    useExtendMembership({
      onSuccess: () => {
        revalidate(["get-members"]);
        setIsOpen(false);
        setSelectedPlanId("");
        toast.success("Berhasil memperpanjang subscription");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Terjadi kesalahan",
        );
      },
      accessToken: token,
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error("Pilih plan terlebih dahulu");
      return;
    }

    if (actionType === "promote") {
      let finalDiscord = discordUsername.trim();
      if (!finalDiscord) {
        toast.error("Discord Username wajib diisi");
        return;
      }
      if (finalDiscord.startsWith("@")) {
        finalDiscord = finalDiscord.substring(1);
      }
      promoteMember({
        user_id: userId,
        plan_id: selectedPlanId,
        discord_username: finalDiscord,
      });
    } else {
      extendMembership({
        userId,
        planId: selectedPlanId,
      });
    }
  };

  const isPending = isPromoteMemberPending || isExtendMembershipPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {actionType === "promote"
              ? "Promote User to Member"
              : isLifetime
                ? "Ubah Paket Lifetime"
                : "Extend Subscription"}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Anda akan memberikan hadiah berupa subscription kepada user
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPlanSubscriptionDataLoading ? (
            <div className="space-y-2">
              <Label htmlFor="plan_id">Pilih Subscription Plan</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih plan" />
                </SelectTrigger>
                <SelectContent>
                  {planSubscriptionData?.results
                    ?.filter(
                      (p: {
                        id: string;
                        name: string;
                        price: number;
                        duration_months: number;
                        account_type?: { name: string };
                      }) => (isLifetime ? p.duration_months === 0 : true),
                    )
                    .map(
                      (plan: {
                        id: string;
                        name: string;
                        price: number;
                        duration_months: number;
                        account_type?: { name: string };
                      }) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.account_type?.name
                            ? `${plan.account_type.name} `
                            : ""}
                          {plan.name} - Rp {plan.price} (
                          {plan.duration_months === 0
                            ? "Lifetime"
                            : `${plan.duration_months} Bulan`}
                          )
                        </SelectItem>
                      ),
                    )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {actionType === "promote" && (
            <div className="space-y-2">
              <Label htmlFor="discord_username">Discord Username</Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-white/10 bg-white/5 px-3 text-gray-400 sm:text-sm">
                  @
                </span>
                <input
                  type="text"
                  name="discord_username"
                  id="discord_username"
                  className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[#D4AF37] focus:ring-[#D4AF37] sm:text-sm"
                  placeholder="username"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
