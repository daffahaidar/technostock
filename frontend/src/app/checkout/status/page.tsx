import { Metadata } from "next";
import { Suspense } from "react";
import StatusContent from "./status-content";

export const metadata: Metadata = {
  title: "Status Pembayaran - AngelTrade",
  description: "Status pembayaran paket langganan Anda.",
};

export default function CheckoutStatusPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-[#D4AF37] font-semibold text-lg animate-pulse">
            Memuat status pembayaran...
          </div>
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
