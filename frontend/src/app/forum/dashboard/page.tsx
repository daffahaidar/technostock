import SidebarLayout from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { redirect } from "next/navigation";
import SubscriptionCountdown from "./_components/subscription-countdown";
import Link from "next/link";
import { getPublicPricingData } from "@/modules/subscription-plan/actions/get-public-pricing";

import { Suspense } from "react";

export default function MemberDashboardPage() {
  return (
    <SidebarLayout
      
      breadcrumb={[{ name: "Forum", path: "/forum" }, { name: "Dashboard" }]}
    >
      <Suspense fallback={<div className="w-full text-white">Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </SidebarLayout>
  );
}

async function DashboardContent() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  
  const mySubRes = await fetch(`${API_URL}/api/v1/main/subscriptions/my-active`, {
    headers: {
      "Authorization": `Bearer ${session.session.token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
  
  let activeSub = null;
  let planDetails = null;

  if (mySubRes.ok) {
    const subData = await mySubRes.json();
    if (subData?.data) {
      activeSub = subData.data;
      
      // Fetch plan details to get the name
      const planRes = await fetch(`${API_URL}/api/v1/main/public/subscription-plans/${activeSub.subscription_plan_id}`, {
        next: { revalidate: 3600 }
      });
      if (planRes.ok) {
        const planData = await planRes.json();
        planDetails = planData.results;
      }
    }
  }

  // Fetch all pricing plans to show below
  let pricingData = await getPublicPricingData();
  
  // Find which account type the active subscription belongs to
  let activeAccountTypeName = "";
  if (activeSub && activeSub.subscription_plan_id) {
    const matchingAccountType = pricingData.find((at: { id: string; name: string; plans: { id: string }[] }) => 
      at.plans.some((p: { id: string }) => p.id === activeSub.subscription_plan_id)
    );
    
    if (matchingAccountType) {
      activeAccountTypeName = matchingAccountType.name;
      // Filter out the active account type
      pricingData = pricingData.filter((at: { id: string }) => at.id !== matchingAccountType.id);
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8 text-white">Halo, <span className="text-[#D4AF37]">{session.user.name || session.user.email}</span>!</h1>
      
      {activeSub && activeSub.end_date ? (
        <SubscriptionCountdown 
          endDateStr={activeSub.end_date} 
          planName={
            activeAccountTypeName && planDetails?.name
              ? `${activeAccountTypeName} - ${planDetails.name}`
              : planDetails?.name || "Langganan Premium"
          } 
        />
      ) : ["admin", "maintainer"].includes(session.user?.role?.toLowerCase() || "") ? (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-10 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-3">Akses Penuh Sebagai {session.user.role}</h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Anda memiliki akses ke seluruh fitur eksklusif member Technostock karena peran Anda sebagai {session.user.role}.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-3">Belum Ada Langganan Aktif</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">Anda belum memiliki paket langganan yang aktif saat ini. Berlangganan sekarang untuk mengakses semua fitur eksklusif member Technostock.</p>
          <Link href="/#pricing">
            <Button className="h-12 px-8 rounded-xl bg-[#D4AF37] hover:bg-[#F3CA52] text-black font-bold text-base transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              Lihat Paket Langganan
            </Button>
          </Link>
        </div>
      )}

    </div>
  );
}
