"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  description: string;
}

interface AccountType {
  id: string;
  name: string;
  description: string;
  is_recommended: boolean;
  parsedBenefits: string[];
  plans: Plan[];
}

export default function PricingSection({ pricingData, user, compact = false }: { pricingData: AccountType[], user?: unknown, compact?: boolean }) {
  const router = useRouter();
  const typedUser = user as { role?: string } | undefined;
  const isFullAccess = ["admin", "maintainer"].includes(typedUser?.role?.toLowerCase() || "");
  // Store selected plan ID for each account type ID
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    pricingData.forEach((at) => {
      if (at.plans && at.plans.length > 0) {
        // Default to the first plan (e.g. Monthly)
        initial[at.id] = at.plans[0].id;
      }
    });
    return initial;
  });

  const handlePlanChange = (accountTypeId: string, planId: string) => {
    setSelectedPlans((prev) => ({ ...prev, [accountTypeId]: planId }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="pricing" className={compact ? "py-8 relative w-full" : "py-24 bg-black text-white relative overflow-hidden"}>
      {/* Background gradients */}
      {!compact && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        </div>
      )}

      <div className="container mx-auto px-0 md:px-0 relative z-10 w-full">
        {!compact && (
          <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Investasi Cerdas untuk Masa Depan Anda
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            Pilih paket berlangganan yang sesuai dengan kebutuhan dan target investasi Anda.
          </motion.p>
        </div>
        )}

        {pricingData.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            Belum ada paket langganan yang tersedia saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 max-w-7xl mx-auto">
            {pricingData.map((at, index) => {
              const selectedPlanId = selectedPlans[at.id];
              const selectedPlan = at.plans.find((p) => p.id === selectedPlanId) || at.plans[0];
              const isRecommended = at.is_recommended;

              // Determine grid column span based on total items
              const total = pricingData.length;
              let colSpanClass = "lg:col-span-2"; // default for 3 items
              
              if (total === 1) colSpanClass = "lg:col-span-6";
              else if (total === 2) colSpanClass = "lg:col-span-3";
              else if (total === 4) {
                if (index < 3) colSpanClass = "lg:col-span-2";
                else colSpanClass = "lg:col-span-6"; // full width bottom
              } else if (total === 5) {
                if (index < 3) colSpanClass = "lg:col-span-2";
                else colSpanClass = "lg:col-span-3"; // 2 items bottom
              }

              return (
                <motion.div
                  key={at.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`relative flex flex-col p-8 rounded-3xl backdrop-blur-sm transition-all duration-300 md:col-span-1 ${colSpanClass} ${
                    isRecommended 
                      ? "bg-white/5 border border-[#D4AF37]/50 shadow-[0_0_30px_rgba(212,175,55,0.15)]" 
                      : "bg-white/5 border border-white/10 hover:border-[#D4AF37]/30"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black border-none px-4 py-1 text-xs font-bold tracking-wide rounded-full">
                        Rekomendasi
                      </Badge>
                    </div>
                  )}

                  <div className="mb-8">
                    <h3 className={`text-2xl font-bold mb-2 ${isRecommended ? "text-[#F9E596]" : ""}`}>{at.name}</h3>
                    <p className="text-sm text-gray-400 min-h-[40px]">{at.description}</p>
                  </div>

                  {at.plans.length > 0 ? (
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold tracking-tight">
                          {formatPrice(selectedPlan?.price || 0)}
                        </span>
                      </div>
                      
                      {at.plans.length > 1 && (
                        <div className="flex flex-wrap gap-2 mt-4 bg-black/40 p-1.5 rounded-lg border border-white/5">
                          {at.plans.map((plan) => (
                            <button
                              key={plan.id}
                              onClick={() => handlePlanChange(at.id, plan.id)}
                              className={`flex-1 py-1.5 px-3 text-xs md:text-sm font-medium rounded-md transition-all ${
                                selectedPlanId === plan.id
                                  ? "bg-white/10 text-[#F9E596] shadow-sm"
                                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                              }`}
                            >
                              {plan.name}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {selectedPlan?.description && (
                        <p className="text-xs text-[#D4AF37]/80 mt-3">{selectedPlan.description}</p>
                      )}
                    </div>
                  ) : (
                    <div className="mb-8">
                      <span className="text-xl font-medium text-gray-500">
                        Plan ini akan segera hadir
                      </span>
                    </div>
                  )}

                  <div className="flex-grow">
                    <p className="text-sm font-medium mb-4 text-gray-300">Yang akan Anda dapatkan:</p>
                    <ul className="space-y-3 mb-8">
                      {at.parsedBenefits?.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-300">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className={`w-full h-12 rounded-xl text-base font-semibold transition-all ${
                      isRecommended 
                        ? "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]" 
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                    }`}
                    disabled={at.plans.length === 0 || isFullAccess}
                    onClick={() => {
                      if (at.plans.length === 0 || isFullAccess) return;
                      
                      if (!user) {
                        router.push(`/auth/sign-in?callbackUrl=/checkout?planId=${selectedPlan.id}`);
                      } else {
                        router.push(`/checkout?planId=${selectedPlan.id}`);
                      }
                    }}
                  >
                    {at.plans.length === 0 ? "Coming Soon" : isFullAccess ? `Anda Sudah Memiliki Akses Penuh` : "Mulai Berlangganan"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
