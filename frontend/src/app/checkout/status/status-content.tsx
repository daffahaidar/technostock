"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { ENDPOINT } from "@/endpoint";
import { clearAccessToken } from "./actions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function StatusContent() {
  const searchParams = useSearchParams();
  const urlTransactionStatus = searchParams.get("transaction_status");
  const orderId = searchParams.get("order_id");

  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session.token;

  const [realStatus, setRealStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  useEffect(() => {
    // Jika tidak ada orderId, tidak perlu sinkronisasi
    if (!orderId) {
      setIsSyncing(false);
      return;
    }
    
    // Tunggu sampai token tersedia
    if (!token) return;

    const syncTransaction = async () => {
      try {
        const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.TRANSACTION_SYNC(orderId)}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data && data.data && data.data.status) {
          const fetchedStatus = data.data.status;
          setRealStatus(fetchedStatus);
          
          if (fetchedStatus === "capture" || fetchedStatus === "settlement") {
            // Force session refresh by deleting access_token
            // proxy.ts (middleware) will use refresh_token to fetch new token with updated role
            await clearAccessToken();
          }
        } else {
          setRealStatus(urlTransactionStatus);
        }
      } catch (error) {
        console.error("Failed to sync transaction:", error);
        setRealStatus(urlTransactionStatus);
      } finally {
        setIsSyncing(false);
      }
    };

    syncTransaction();
  }, [orderId, token, urlTransactionStatus]);

  const finalStatus = realStatus || urlTransactionStatus;

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
        </div>
        <div className="z-10 w-full max-w-lg text-center flex flex-col items-center justify-center">
          <Loader2 className="w-16 h-16 text-[#D4AF37] animate-spin mb-6" />
          <h1 className="text-2xl font-bold mb-4">Memverifikasi Pembayaran...</h1>
          <p className="text-gray-400">Mohon tunggu sebentar, kami sedang menyinkronkan status pembayaran Anda dengan server.</p>
        </div>
      </div>
    );
  }

  let statusConfig = {
    title: "Status Pembayaran Tidak Diketahui",
    description: "Kami tidak dapat mengonfirmasi status pembayaran Anda saat ini. Silakan periksa email Anda atau hubungi dukungan pelanggan.",
    icon: <Clock className="w-20 h-20 text-gray-500 mb-6" />,
    color: "from-gray-500/20 to-transparent",
    borderColor: "border-gray-500/30",
    buttonText: "Kembali ke Beranda",
    buttonHref: "/"
  };

  if (finalStatus === "capture" || finalStatus === "settlement") {
    statusConfig = {
      title: "Pembayaran Berhasil!",
      description: "Terima kasih! Pembayaran langganan Anda telah berhasil diproses. Anda sekarang memiliki akses penuh ke fitur eksklusif Technostock.",
      icon: <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />,
      color: "from-green-500/20 to-transparent",
      borderColor: "border-green-500/30",
      buttonText: "Masuk ke Member Area",
      buttonHref: "/forum/dashboard"
    };
  } else if (finalStatus === "pending") {
    statusConfig = {
      title: "Menunggu Pembayaran",
      description: "Pesanan Anda telah dibuat. Silakan selesaikan pembayaran sesuai dengan metode yang Anda pilih sebelum batas waktu berakhir.",
      icon: <Clock className="w-20 h-20 text-[#D4AF37] mb-6" />,
      color: "from-[#D4AF37]/20 to-transparent",
      borderColor: "border-[#D4AF37]/30",
      buttonText: "Ke Dashboard",
      buttonHref: "/forum/dashboard"
    };
  } else if (finalStatus === "deny" || finalStatus === "cancel" || finalStatus === "expire" || finalStatus === "failed") {
    statusConfig = {
      title: "Pembayaran Gagal atau Kedaluwarsa",
      description: "Mohon maaf, transaksi Anda gagal, dibatalkan, atau telah melewati batas waktu pembayaran. Silakan coba lakukan checkout kembali.",
      icon: <XCircle className="w-20 h-20 text-red-500 mb-6" />,
      color: "from-red-500/20 to-transparent",
      borderColor: "border-red-500/30",
      buttonText: "Coba Lagi",
      buttonHref: "/#pricing"
    };
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
      </div>

      <div className="z-10 w-full max-w-lg">
        <div className={`bg-gradient-to-b ${statusConfig.color} bg-black/60 backdrop-blur-xl border ${statusConfig.borderColor} rounded-3xl p-10 text-center shadow-2xl`}>
          <div className="flex justify-center">
            {statusConfig.icon}
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{statusConfig.title}</h1>
          
          {orderId && (
            <div className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 mb-6 inline-block">
              <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Order ID</p>
              <p className="font-mono text-[#F9E596] text-sm">{orderId}</p>
            </div>
          )}

          <p className="text-gray-300 mb-10 leading-relaxed">
            {statusConfig.description}
          </p>

          <Link href={statusConfig.buttonHref} className="block w-full">
            <Button className="w-full h-14 rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#F3CA52] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-2 group">
              {statusConfig.buttonText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
