"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { processCheckout, checkVoucher } from "./action";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Tag, X } from "lucide-react";

export default function CheckoutClient({ 
  planDetails, 
  planId,
  initialDiscordUsername,
  hasActiveSubscription
}: { 
  planDetails: { account_type?: { name?: string }, name?: string, price: number, description?: string }; 
  planId: string; 
  initialDiscordUsername?: string | null;
  hasActiveSubscription?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [discordUsername, setDiscordUsername] = useState("");
  const [discordUsernameError, setDiscordUsernameError] = useState("");

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ discount_percentage: number, max_discount_amount: number, code: string } | null>(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    let finalDiscordUsername = initialDiscordUsername || discordUsername;
    
    if (!finalDiscordUsername || finalDiscordUsername.trim() === "") {
      setDiscordUsernameError("Discord Username wajib diisi");
      return;
    }
    
    // Remove @ if user added it
    if (finalDiscordUsername.startsWith("@")) {
      finalDiscordUsername = finalDiscordUsername.substring(1);
    }
    
    try {
      setIsLoading(true);
      const returnUrl = window.location.origin + "/checkout/status";
      
      const result = await processCheckout(planId, returnUrl, finalDiscordUsername, appliedVoucher?.code);
      
      if (result?.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        toast.error("Gagal mendapatkan link pembayaran");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error((error as Error).message || "Terjadi kesalahan saat memproses pembayaran");
      setIsLoading(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      setIsCheckingVoucher(true);
      setVoucherError("");
      const result = await checkVoucher(voucherCode);
      setAppliedVoucher(result);
      toast.success("Voucher berhasil digunakan");
    } catch (err) {
      setVoucherError((err as Error).message);
      setAppliedVoucher(null);
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  let discountAmount = 0;
  if (appliedVoucher) {
    discountAmount = planDetails.price * (appliedVoucher.discount_percentage / 100);
    if (discountAmount > appliedVoucher.max_discount_amount) {
      discountAmount = appliedVoucher.max_discount_amount;
    }
  }

  let finalPrice = planDetails.price - discountAmount;
  if (finalPrice < 0) finalPrice = 0;

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Left side: Plan summary */}
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-[#F9E596] mb-2">Ringkasan Pesanan</h2>
          <p className="text-gray-400 text-sm mb-6">Harap pastikan detail pesanan Anda sudah benar.</p>
          
          <div className="flex justify-between items-center pb-6 border-b border-white/10">
            <div>
              <h3 className="text-xl font-bold text-white">{planDetails.account_type?.name || "Paket Langganan"}</h3>
              <p className="text-[#D4AF37]">{planDetails.name}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{formatPrice(planDetails.price)}</span>
            </div>
          </div>
          
          {planDetails.description && (
            <div className="pt-6 text-sm text-gray-300">
              <p>{planDetails.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-[#D4AF37]/20 rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            Keamanan Terjamin
          </h3>
          <p className="text-sm text-gray-400">
            Pembayaran Anda diproses secara aman menggunakan sistem enkripsi tingkat tinggi (SSL). 
            Technostock tidak pernah menyimpan data rahasia kartu Anda secara langsung.
          </p>
        </div>
      </div>

      {/* Right side: Total and Button */}
      <div className="space-y-6">
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-[#D4AF37]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
          <h3 className="text-lg font-bold mb-4">Total Pembayaran</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Harga Paket</span>
              <span>{formatPrice(planDetails.price)}</span>
            </div>
            
            {appliedVoucher && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Diskon ({appliedVoucher.code})</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            
            <div className="pt-3 border-t border-white/10 flex justify-between font-bold text-lg text-[#F9E596]">
              <span>Total</span>
              <span>{formatPrice(finalPrice)}</span>
            </div>
          </div>
          
          {hasActiveSubscription ? (
            <div className="mb-6 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-center">
              <p className="text-[#F9E596] font-medium">Anda memiliki langganan aktif di plan ini.</p>
              <p className="text-sm text-gray-400 mt-2">Anda dapat memperpanjang paket ini setelah masa aktif langganan Anda saat ini berakhir.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 border-t border-white/10 pt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Discord Username</h4>
                {initialDiscordUsername ? (
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[#F9E596] font-medium">{initialDiscordUsername}</span>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={discordUsername}
                      onChange={(e) => {
                        setDiscordUsername(e.target.value);
                        if (e.target.value) setDiscordUsernameError("");
                      }}
                      placeholder="Contoh: user123 (tanpa @)"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                    />
                    {discordUsernameError && (
                      <p className="text-red-500 text-xs mt-1">{discordUsernameError}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Dibutuhkan untuk pemberian akses komunitas Discord</p>
                  </div>
                )}
              </div>

              <div className="mb-6 border-t border-white/10 pt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#D4AF37]" />
                  Kode Voucher
                </h4>
                {appliedVoucher ? (
                  <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-green-400 font-medium block">{appliedVoucher.code}</span>
                      <span className="text-xs text-green-500">Berhasil diterapkan</span>
                    </div>
                    <button onClick={() => setAppliedVoucher(null)} className="text-gray-400 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          if (e.target.value) setVoucherError("");
                        }}
                        placeholder="Contoh: PROMO2026"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                      <Button 
                        onClick={handleApplyVoucher}
                        disabled={isCheckingVoucher || !voucherCode}
                        className="h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                      >
                        {isCheckingVoucher ? "Cek..." : "Gunakan"}
                      </Button>
                    </div>
                    {voucherError && (
                      <p className="text-red-500 text-xs mt-1">{voucherError}</p>
                    )}
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-12 rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#F3CA52] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all"
                onClick={handleCheckout}
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Konfirmasi Pembayaran"}
              </Button>
            </>
          )}
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Anda akan diarahkan ke halaman pembayaran Midtrans yang aman.
          </p>
        </div>
      </div>
    </div>
  );
}
