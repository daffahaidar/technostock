import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { promoteToMember, extendSubscription } from "../actions/member-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getSubscriptionPlans } from "@/modules/subscription-plan/actions/subscription-plan-actions";

interface ActionModalProps {
  userId: string;
  actionType: "promote" | "extend";
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isLifetime?: boolean;
  discordUsername?: string;
}

export function MemberActionModal({ userId, actionType, isOpen, setIsOpen, isLifetime, discordUsername: initialDiscordUsername }: ActionModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [discordUsername, setDiscordUsername] = useState(initialDiscordUsername || "");
  const queryClient = useQueryClient();

  // Reset form saat dialog dibuka. Pola "adjust state during render" (React docs)
  // dipakai alih-alih useEffect+setState yang memicu cascading render.
  // Bonus: selectedPlanId dulu tidak pernah di-reset antar pembukaan dialog.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDiscordUsername(initialDiscordUsername || "");
      setSelectedPlanId("");
    }
  }

  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token;

  // Fetch plans to show in dropdown
  const { data: plansData } = useQuery({
    queryKey: ["get-subscription-plans", token],
    queryFn: async () => {
      if (!token) return { results: [] };
      return (await getSubscriptionPlans(token)) as { 
        results: { id: string; name: string; price: number; duration_months: number; account_type?: { name: string } }[] 
      };
    },
    enabled: !!token && isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No token");
      if (actionType === "promote") {
        let finalDiscord = discordUsername.trim();
        if (!finalDiscord) {
          throw new Error("Discord Username wajib diisi");
        }
        if (finalDiscord.startsWith("@")) {
          finalDiscord = finalDiscord.substring(1);
        }
        return await promoteToMember(userId, selectedPlanId, finalDiscord, token);
      } else {
        return await extendSubscription(userId, selectedPlanId, token);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["get-members"] });
      toast.success(`Berhasil ${actionType === "promote" ? "promote user" : "extend subscription"}`);
      setIsOpen(false);
      setSelectedPlanId("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error("Pilih plan terlebih dahulu");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{actionType === "promote" ? "Promote User to Member" : isLifetime ? "Ubah Paket Lifetime" : "Extend Subscription"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan_id">Pilih Subscription Plan</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih plan" />
              </SelectTrigger>
              <SelectContent>
                {plansData?.results?.filter(p => isLifetime ? p.duration_months === 0 : true).map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.account_type?.name ? `${plan.account_type.name} ` : ""}{plan.name} - Rp {plan.price} ({plan.duration_months === 0 ? "Lifetime" : `${plan.duration_months} Bulan`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
          
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
