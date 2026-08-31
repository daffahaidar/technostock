"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { useGetActiveSubscription } from "@/app/[panel]/subscriptions/plans/_queries/active-subscription";
import { useGetPublicPricing } from "@/app/[panel]/subscriptions/plans/_queries/public-pricing";
import type { PricingItem } from "@/app/[panel]/subscriptions/plans/_schemas/pricing";
import { isFullAccessRole } from "@/constants/roles";
import SubscriptionCountdown from "./subscription-countdown";

export default function DashboardSubscription({ role }: { role?: string }) {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";

  const { activeSubscriptionData, isActiveSubscriptionDataLoading } =
    useGetActiveSubscription(token);
  const { pricingData } = useGetPublicPricing();

  const activeSub = activeSubscriptionData?.data || null;
  const pricing = (pricingData?.results as PricingItem[]) || [];

  // Nama paket diambil dari data pricing yang sudah ada, jadi tidak perlu
  // request detail plan terpisah.
  const accountType = pricing.find((item) =>
    item.plans?.some((plan) => plan.id === activeSub?.subscription_plan_id),
  );
  const plan = accountType?.plans.find(
    (item) => item.id === activeSub?.subscription_plan_id,
  );
  const planName =
    accountType && plan
      ? `${accountType.name} - ${plan.name}`
      : plan?.name || "Langganan Premium";

  if (isActiveSubscriptionDataLoading) {
    return (
      <div className="animate-pulse bg-white/5 h-48 max-w-4xl rounded-2xl border border-white/10" />
    );
  }

  if (activeSub) {
    return (
      <SubscriptionCountdown endDateStr={activeSub.end_date} planName={planName} />
    );
  }

  if (isFullAccessRole(role)) {
    return (
      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-10 text-center shadow-lg">
        <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">
          Akses Penuh Sebagai {role}
        </h2>
        <p className="text-gray-400 max-w-lg mx-auto">
          Anda memiliki akses ke seluruh fitur eksklusif member AngelTrade karena
          peran Anda sebagai {role}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-3">
        Belum Ada Langganan Aktif
      </h2>
      <p className="text-gray-400 mb-8 max-w-lg mx-auto">
        Anda belum memiliki paket langganan yang aktif saat ini. Berlangganan
        sekarang untuk mengakses semua fitur eksklusif member AngelTrade.
      </p>
      <Link href="/#pricing">
        <Button className="h-12 px-8 rounded-xl bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold text-base transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          Lihat Paket Langganan
        </Button>
      </Link>
    </div>
  );
}
