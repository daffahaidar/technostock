"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Kurikulum Terstruktur",
    description: "Materi disusun secara logis dari dasar hingga mahir, memastikan Anda memahami setiap konsep tanpa kebingungan.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Mentor Berpengalaman",
    description: "Belajar langsung dari praktisi pasar modal yang telah terbukti profit dan bertahan di berbagai kondisi market.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: "Komunitas Eksklusif",
    description: "Bergabung dengan ribuan trader lainnya. Diskusi analisa, berbagi insight, dan berkembang bersama dalam satu wadah.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Live Trading Sessions",
    description: "Lihat langsung bagaimana mentor menganalisa market secara real-time dan mengeksekusi trading plan setiap minggunya.",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("animate-in"), i * 100);
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
      id="features"
      ref={sectionRef}
      className="py-32 bg-luxury-black relative overflow-hidden"
    >
      {/* Grid background for texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      
      {/* Ambient glows for glassmorphism */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left – Text */}
          <div>
            <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
              <span className="inline-block text-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase mb-5">
                Mengapa AngelTrade
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Platform Belajar
                <br />
                <span className="text-gradient-gold">Saham Terbaik.</span>
              </h2>
              <p className="mt-6 text-white/60 text-lg leading-relaxed">
                Kami tidak hanya menjual kelas teori. Kami membekali Anda dengan skill praktis, 
                psikologi trading yang benar, dan dukungan komunitas seumur hidup agar Anda 
                bisa mandiri di pasar modal.
              </p>
            </div>

            {/* Feature list */}
            <div className="mt-12 space-y-8">
              {features.map((feature, i) => (
                <div
                  key={feature.title}
                  className="reveal opacity-0 translate-y-8 transition-all duration-700 flex gap-5 group"
                  style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-[#121212] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right – Visual element */}
          <div className="reveal opacity-0 translate-x-8 transition-all duration-700 delay-300">
            <div className="relative">
              {/* Main card */}
              <div className="glass-panel-gold rounded-3xl p-8 relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-white/60 text-sm font-medium">
                    Performa Alumni
                  </span>
                  <span className="flex items-center gap-2 text-[#F3CA52] text-sm font-medium">
                    <span className="w-2 h-2 bg-[#F3CA52] rounded-full animate-pulse shadow-[0_0_8px_#F3CA52]" />
                    Profitable Trader
                  </span>
                </div>

                {/* Metrics */}
                {[
                  { label: "Win Rate", value: "65%", sub: "Rata-rata", progress: 65 },
                  { label: "Risk to Reward", value: "1:3", sub: "Rasio optimal", progress: 85 },
                  { label: "Pertumbuhan Akun", value: "+25%", sub: "Dalam 6 bulan", progress: 75 },
                  { label: "Kepuasan Member", value: "99%", sub: "Rating positif", progress: 99 },
                ].map((metric) => (
                  <div key={metric.label} className="mb-6 last:mb-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white/60 text-xs">{metric.label}</span>
                      <div className="text-right">
                        <span className="text-white text-sm font-semibold">{metric.value}</span>
                        <span className="text-white/30 text-xs ml-2">{metric.sub}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full transition-all duration-1000"
                        style={{ width: `${metric.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-[#D4AF37] text-black text-xs font-bold px-4 py-2 rounded-full shadow-[0_5px_20px_rgba(212,175,55,0.4)]">
                Live Portfolio
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
