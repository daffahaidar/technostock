"use client";

import { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Buat Akun",
    description:
      "Daftar dan lengkapi profil Anda dalam hitungan menit untuk mendapatkan akses instan ke dashboard belajar Technostock.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Pilih Kelas",
    description:
      "Pilih program yang paling sesuai dengan tingkat pengalaman dan modal Anda. Mulai dari Fundamental hingga Technical Analysis pro.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Mulai Belajar",
    description:
      "Tonton materi video resolusi tinggi, baca modul eksklusif, dan ikuti kuis interaktif kapan saja dan di mana saja.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Praktek & Profit",
    description:
      "Terapkan ilmu Anda di market sungguhan. Diskusi trading plan bersama mentor dan ratusan member lainnya di grup komunitas VIP.",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("animate-in"), i * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-32 bg-luxury-black relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0,transparent_100%)]" />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 reveal opacity-0 translate-y-8 transition-all duration-700">
          <span className="inline-block text-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase mb-5">
            Cara Bergabung
          </span>
          <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tight">
            Mulai Perjalanan
            <br />
            <span className="text-gradient-gold">Trading Anda.</span>
          </h2>
          <p className="mt-6 text-white/60 text-lg max-w-xl mx-auto">
            Hanya butuh 4 langkah mudah untuk mulai belajar dan 
            mencetak profit konsisten di pasar saham.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line – desktop */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="reveal opacity-0 translate-y-8 transition-all duration-700 flex flex-col items-start lg:items-center text-left lg:text-center group"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                {/* Step number circle */}
                <div className="relative mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#121212] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-0 group-hover:scale-110 group-hover:rounded-3xl group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#D4AF37] border-2 border-[#121212] rounded-full flex items-center justify-center">
                    <span className="text-black text-[10px] font-bold">
                      {step.number}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
