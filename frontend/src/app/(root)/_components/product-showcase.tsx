"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const products = [
  {
    name: "Saham Mastery 101",
    category: "Pemula",
    description: "Pelajari dasar-dasar trading saham, investasi jangka panjang, dan analisis fundamental dari nol.",
    badge: "Best Seller",
    badgeColor: "bg-gradient-to-r from-gold-400 to-gold-500 text-black shadow-[0_0_10px_rgba(243,202,82,0.4)]",
  },
  {
    name: "Technical Analysis Pro",
    category: "Lanjutan",
    description: "Kuasai cara membaca chart, menggunakan indikator teknikal, dan memahami price action.",
    badge: "Populer",
    badgeColor: "bg-gradient-to-r from-gold-500 to-gold-600 text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]",
  },
  {
    name: "VIP Mentoring",
    category: "Eksklusif",
    description: "Bimbingan langsung 1-on-1 dengan mentor profesional dan akses eksklusif ke sesi live trading.",
    badge: "Premium",
    badgeColor: "bg-gradient-to-r from-gold-600 to-gold-700 text-white shadow-[0_0_10px_rgba(170,140,44,0.4)]",
  },
];

export default function ProductShowcase() {
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
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="products"
      ref={sectionRef}
      className="relative overflow-hidden bg-luxury-black py-32"
    >
      {/* Orbs for glass background */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-[#F3CA52]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(212,175,55,0.08),transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="reveal mb-20 translate-y-8 text-center opacity-0 transition-all duration-700">
          <span className="mb-5 inline-block text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
            Katalog Kelas
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
            Edukasi yang akan
            <br />
            <span className="text-gradient-gold">
              mengubah trading Anda.
            </span>
          </h2>
        </div>

        {/* Featured showcase */}
        <div className="reveal mb-12 translate-y-8 opacity-0 transition-all duration-700">
          <div className="relative overflow-hidden rounded-3xl glass-panel-gold">
            <div className="grid gap-0 lg:grid-cols-2">
              {/* Image */}
              <div className="relative flex min-h-[400px] items-center justify-center bg-zinc-900/50 p-12 lg:min-h-[500px]">
                <Image
                  src="/product-showcase-class.jpg"
                  alt="AngelTrade Class Lineup"
                  width={500}
                  height={400}
                  className="w-full max-w-md object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center p-12">
                <span className="mb-4 text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
                  Program Lengkap
                </span>
                <h3 className="mb-4 text-3xl leading-tight font-bold text-white">
                  AngelTrade
                  <br />
                  Masterclass
                </h3>
                <p className="mb-8 leading-relaxed text-white/50">
                  Tiga tingkat kelas komprehensif yang dirancang untuk memandu Anda dari 
                  pemula hingga menjadi trader mandiri. Pelajari fundamental, teknikal, 
                  dan psikologi trading dari para profesional.
                </p>

                <div className="mb-8 space-y-4">
                  {[
                    "Akses materi seumur hidup",
                    "Sesi live trading mingguan",
                    "Grup diskusi VIP eksklusif",
                    "Sertifikat kelulusan kelas",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
                        <svg
                          className="h-3 w-3 text-[#D4AF37]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-gold px-6 py-3 text-sm font-bold text-black transition-all duration-300 hover:scale-105 hover:brightness-110 gold-glow"
                >
                  Lihat Detail Kelas
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Product cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {products.map((product, i) => (
            <div
              key={product.name}
              className="reveal group relative translate-y-8 cursor-pointer rounded-2xl p-6 opacity-0 transition-all duration-700 glass-card-gold hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 hover:shadow-[0_10px_40px_rgba(212,175,55,0.15)]"
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wider text-[#D4AF37]/70 uppercase">
                    {product.category}
                  </p>
                  <h3 className="text-lg font-semibold text-white">
                    {product.name}
                  </h3>
                </div>
                <span
                  className={`${product.badgeColor} rounded-full px-2.5 py-1 text-xs font-semibold text-white`}
                >
                  {product.badge}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/50">
                {product.description}
              </p>
              <div className="mt-5 flex items-center gap-2 text-xs text-[#D4AF37]/70 transition-colors group-hover:text-[#D4AF37]">
                Learn more
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
