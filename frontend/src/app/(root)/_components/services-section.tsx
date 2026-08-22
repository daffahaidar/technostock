"use client";

import { useEffect, useRef } from "react";

const services = [
  {
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"
        />
      </svg>
    ),
    title: "Kelas Saham Pemula",
    description:
      "Materi terstruktur dari dasar. Pahami cara kerja pasar modal, membuat akun broker, hingga cara membeli saham pertama Anda tanpa kebingungan.",
    tags: ["Fundamental", "Mindset", "Money Management"],
    accent: "from-gold-400 to-gold-600",
    glow: "group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]",
  },
  {
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        />
      </svg>
    ),
    title: "Analisa Teknikal Profesional",
    description:
      "Kuasai seni membaca chart. Pelajari indikator teknikal, price action, pola candlestick, dan cara menentukan titik beli/jual yang presisi dengan akurasi tinggi.",
    tags: ["Chart Patterns", "Indikator", "Price Action"],
    accent: "from-gold-300 to-gold-500",
    glow: "group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]",
  },
  {
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
        />
      </svg>
    ),
    title: "Mentoring Private",
    description:
      "Bimbingan intensif 1-on-1 dengan mentor profesional. Dapatkan feedback langsung atas trading plan Anda dan akses VIP eksklusif ke live trading session.",
    tags: ["1-on-1 Mentoring", "Live Trading", "Review Portofolio"],
    accent: "from-gold-500 to-gold-700",
    glow: "group-hover:shadow-[0_0_30px_rgba(212,175,55,0.15)]",
  },
];

export default function ServicesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll(".reveal");
            children.forEach((el, i) => {
              setTimeout(() => {
                el.classList.add("animate-in");
              }, i * 120);
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
      id="services"
      ref={sectionRef}
      className="relative overflow-hidden bg-luxury-black py-32"
    >
      {/* Background orbs for glass effect */}
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle separator line */}
      <div className="absolute top-0 left-1/2 h-20 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="reveal mb-20 translate-y-8 text-center opacity-0 transition-all duration-700">
          <span className="mb-5 inline-block text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
            Layanan Kami
          </span>
          <h2 className="text-4xl leading-tight font-bold tracking-tight text-white lg:text-6xl">
            Edukasi Terlengkap
            <br />
            <span className="text-gradient-gold">
              untuk Trading Anda.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
            Kami menyediakan berbagai pilihan kelas dan layanan mentoring yang dirancang khusus 
            untuk mempercepat kurva belajar Anda di pasar saham.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`reveal group relative translate-y-8 cursor-pointer rounded-3xl p-8 opacity-0 transition-all duration-300 glass-card-gold hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 ${service.glow}`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {/* Icon */}
              <div
                className={`inline-flex rounded-2xl bg-gradient-to-br p-3 ${service.accent} bg-opacity-10 mb-6 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110`}
                style={{
                  background: `linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))`,
                }}
              >
                <span
                  className={`bg-gradient-to-br ${service.accent} bg-clip-text`}
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  {service.icon}
                </span>
              </div>

              <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-white">
                {service.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-white/50 transition-colors group-hover:text-white/60">
                {service.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-1 text-xs font-medium text-[#F9E596]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hover arrow */}
              <div className="absolute top-8 right-8 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <svg
                  className="h-5 w-5 text-[#D4AF37]"
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
