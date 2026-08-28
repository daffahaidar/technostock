import { redirect } from "next/navigation";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import CheckoutClient from "./checkout-client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout - AngelTrade",
  description: "Selesaikan pembayaran Anda untuk memulai investasi.",
};

import { Suspense } from "react";

async function CheckoutPageContent({ searchParams }: { searchParams: Promise<{ planId?: string }> }) {
  const session = await getSession();
  const { planId } = await searchParams;
  
  // If not logged in, they should not be here. We redirect them with callback url.
  if (!session?.user) {
    const callback = `/checkout?planId=${planId}`;
    redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(callback)}`);
  }

  if (!planId) {
    redirect("/#pricing");
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  
  // Fetch plan details from public endpoint
  const res = await fetch(`${API_URL}/api/v1/main/public/subscription-plans/${planId}`, {
    next: { revalidate: 60 }
  });

  if (!res.ok) {
    redirect("/#pricing");
  }

  const data = await res.json();
  const planDetails = data.results;

  if (!planDetails) {
    redirect("/#pricing");
  }

  // Check for active subscription
  let hasActiveSubscription = false;
  const mySubRes = await fetch(`${API_URL}/api/v1/main/subscriptions/my-active`, {
    headers: {
      "Authorization": `Bearer ${session.session.token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
  
  if (mySubRes.ok) {
    const subData = await mySubRes.json();
    if (subData?.data?.subscription_plan_id === planId) {
      hasActiveSubscription = true;
    }
  }

  return (
    <CheckoutClient 
      planDetails={planDetails} 
      planId={planId} 
      initialDiscordUsername={session.user.discord_username}
      hasActiveSubscription={hasActiveSubscription}
    />
  );
}

export default function CheckoutPage({ searchParams }: { searchParams: Promise<{ planId?: string }> }) {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/#pricing" 
              className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-[#D4AF37] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Pilihan Paket
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          </div>
          
          {/* Main Content */}
          <Suspense fallback={<div className="animate-pulse bg-white/5 rounded-2xl h-64 border border-white/10 p-6 flex flex-col justify-center items-center"><div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-sm text-gray-400">Menyiapkan halaman pembayaran...</p></div>}>
            <CheckoutPageContent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
