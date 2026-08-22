"use client";

import { useEffect, useRef } from "react";

const testimonials = [
  {
    quote:
      "Kelas Technostock benar-benar membuka mata saya. Dari yang awalnya sering boncos tebak-tebakan, sekarang saya bisa konsisten profit 5-10% tiap bulan berkat ilmunya.",
    author: "Budi Santoso",
    role: "Trader Pemula",
    company: "Alumni Angkatan 3",
    initials: "BS",
  },
  {
    quote:
      "Penjelasan teknikalnya sangat mudah dipahami bahkan untuk orang awam. Grup VIP-nya juga sangat aktif dan mentor selalu stand-by menjawab pertanyaan.",
    author: "Siti Rahayu",
    role: "Ibu Rumah Tangga",
    company: "Alumni Angkatan 5",
    initials: "SR",
  },
  {
    quote:
      "Materi money management adalah life saver! Dulu saya trading tanpa perhitungan resiko, sekarang semua by data dan trading jadi jauh lebih tenang.",
    author: "Ahmad Fauzi",
    role: "Karyawan Swasta",
    company: "Alumni Angkatan 2",
    initials: "AF",
  },
];

const clients = [
  "Mirae Asset",
  "IndoPremier",
  "Ajaib",
  "Stockbit",
  "Mandiri Sekuritas",
  "BNI Sekuritas",
  "Trimegah",
  "Phillip Sekuritas",
];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".reveal").forEach((el, i) => {
              setTimeout(() => el.classList.add("animate-in"), i * 120);
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
      id="testimonials"
      ref={sectionRef}
      className="relative overflow-hidden bg-luxury-black py-32"
    >
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-[#F3CA52]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(212,175,55,0.05),transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="reveal mb-20 translate-y-8 text-center opacity-0 transition-all duration-700">
          <span className="mb-5 inline-block text-xs font-semibold tracking-[0.2em] text-[#D4AF37] uppercase">
            Kisah Sukses
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
            Dipercaya oleh
            <br />
            <span className="text-gradient-gold">
              ribuan trader.
            </span>
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="mb-20 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className="reveal translate-y-8 rounded-3xl p-8 opacity-0 transition-all duration-300 glass-card-gold hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 hover:shadow-[0_10px_40px_rgba(212,175,55,0.15)]"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Quote marks */}
              <div className="mb-4 font-serif text-6xl leading-none text-[#D4AF37]/20">
                &ldquo;
              </div>

              <p className="mb-8 text-sm leading-relaxed text-white/70">
                {t.quote}
              </p>

              <div className="flex items-center gap-4 border-t border-[#D4AF37]/10 pt-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 text-sm font-semibold text-[#D4AF37] border border-[#D4AF37]/30">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-white/40">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Client logos / names */}
        <div className="reveal translate-y-8 opacity-0 transition-all duration-700">
          <p className="mb-8 text-center text-xs font-semibold tracking-widest text-[#D4AF37]/40 uppercase">
            Anggota komunitas kami menggunakan platform broker terkemuka
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {clients.map((client) => (
              <span
                key={client}
                className="cursor-default text-sm font-semibold text-[#D4AF37]/30 transition-colors duration-200 hover:text-[#D4AF37]/70"
              >
                {client}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
