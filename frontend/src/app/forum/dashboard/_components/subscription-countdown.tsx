"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export default function SubscriptionCountdown({ endDateStr, planName }: { endDateStr?: string | null, planName: string }) {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!endDateStr) return;
    const endDate = new Date(endDateStr).getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [endDateStr]);

  if (!endDateStr) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#D4AF37]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(212,175,55,0.08)] relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 p-8 opacity-5 pointer-events-none transform translate-x-1/4">
          <Clock className="w-64 h-64 text-[#D4AF37]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-xl font-bold text-white">Langganan Aktif</h2>
          </div>
          
          <p className="text-[#D4AF37] font-medium mb-8">Paket: {planName}</p>
          
          <div className="bg-black/60 border border-[#D4AF37]/40 rounded-xl p-6 text-center backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.15)] max-w-xl">
            <span className="block text-3xl md:text-5xl font-bold text-[#F9E596] mb-2 tracking-wide">LIFETIME</span>
            <span className="text-xs md:text-sm text-gray-300 font-medium">Berlaku Selamanya</span>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            Masa aktif langganan: Berlaku Selamanya
          </p>
        </div>
      </div>
    );
  }

  if (!timeLeft) {
    return <div className="animate-pulse bg-white/5 h-48 max-w-4xl rounded-2xl border border-white/10"></div>;
  }

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#D4AF37]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(212,175,55,0.08)] relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 p-8 opacity-5 pointer-events-none transform translate-x-1/4">
        <Clock className="w-64 h-64 text-[#D4AF37]" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="text-xl font-bold text-white">Langganan Aktif</h2>
        </div>
        
        <p className="text-[#D4AF37] font-medium mb-8">Paket: {planName}</p>
        
        <div className="grid grid-cols-4 gap-3 md:gap-5 max-w-xl">
          <div className="bg-black/60 border border-[#D4AF37]/20 rounded-xl p-3 md:p-4 text-center backdrop-blur-md shadow-inner">
            <span className="block text-2xl md:text-4xl font-bold text-white mb-1">{timeLeft.days}</span>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-medium">Hari</span>
          </div>
          <div className="bg-black/60 border border-[#D4AF37]/20 rounded-xl p-3 md:p-4 text-center backdrop-blur-md shadow-inner">
            <span className="block text-2xl md:text-4xl font-bold text-white mb-1">{timeLeft.hours}</span>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-medium">Jam</span>
          </div>
          <div className="bg-black/60 border border-[#D4AF37]/20 rounded-xl p-3 md:p-4 text-center backdrop-blur-md shadow-inner">
            <span className="block text-2xl md:text-4xl font-bold text-white mb-1">{timeLeft.minutes}</span>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest font-medium">Menit</span>
          </div>
          <div className="bg-black/60 border border-[#D4AF37]/40 rounded-xl p-3 md:p-4 text-center backdrop-blur-md shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
            <span className="block text-2xl md:text-4xl font-bold text-[#F9E596] mb-1">{timeLeft.seconds}</span>
            <span className="text-[10px] md:text-xs text-[#D4AF37] uppercase tracking-widest font-medium">Detik</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          Masa aktif langganan akan berakhir pada: {new Date(endDateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
