import SidebarLayout from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/app/auth/sign-in/_handlers/server";
import { redirect } from "next/navigation";
import SubscriptionCountdown from "./_components/subscription-countdown";
import Link from "next/link";

export default async function MemberDashboardPage() {
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

  return (
    <SidebarLayout
      // subSidebar={[
      //   { name: "Dashboard", path: "/forum/dashboard" },
      //   { name: "Market News", path: "/forum/news" },
      // ]}
      title="Member Area"
      breadcrumb={[{ name: "Forum", path: "/forum" }, { name: "Dashboard" }]}
    >
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">Halo, <span className="text-[#D4AF37]">{session.user.name || session.user.email}</span>!</h1>
        
        {activeSub && activeSub.end_date ? (
          <SubscriptionCountdown 
            endDateStr={activeSub.end_date} 
            planName={planDetails?.name || "Langganan Premium"} 
          />
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

        {/* Placeholder for future dashboard content */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 text-white">Aktivitas Terbaru</h2>
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex items-center justify-center min-h-[200px]">
            <p className="text-gray-500 text-sm">Belum ada aktivitas untuk ditampilkan.</p>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
