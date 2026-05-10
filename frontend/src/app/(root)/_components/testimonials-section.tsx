"use client";

import { useEffect, useRef } from "react";

const testimonials = [
  {
    quote:
      "Technorider's queue system completely transformed our bank branch operations. Customer wait times dropped by 35% in the first month alone.",
    author: "Budi Santoso",
    role: "Operations Director",
    company: "Bank Mandiri Regional",
    initials: "BS",
  },
  {
    quote:
      "The digital weighing integration with our ERP saved us hours of manual data entry every day. The precision is outstanding — no more disputes with suppliers.",
    author: "Siti Rahayu",
    role: "Head of Logistics",
    company: "Gudang Garam Distribution",
    initials: "SR",
  },
  {
    quote:
      "Our cold storage facility is now fully automated. ClimaGuard sends instant alerts if anything drifts even slightly. The ROI was immediate.",
    author: "Ahmad Fauzi",
    role: "Facility Manager",
    company: "Indofood Cold Chain",
    initials: "AF",
  },
];

const clients = [
  "Bank Mandiri",
  "Grab",
  "Tokopedia",
  "Indofood",
  "Mayora",
  "BCA",
  "Astra Group",
  "Telkom",
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
      className="relative overflow-hidden bg-black py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(255,255,255,0.03),transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="reveal mb-20 translate-y-8 text-center opacity-0 transition-all duration-700">
          <span className="mb-5 inline-block text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
            Client Stories
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
            Trusted by
            <br />
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
              industry leaders.
            </span>
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="mb-20 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className="reveal translate-y-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 opacity-0 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Quote marks */}
              <div className="mb-4 font-serif text-6xl leading-none text-white/20">
                &ldquo;
              </div>

              <p className="mb-8 text-sm leading-relaxed text-white/70">
                {t.quote}
              </p>

              <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 text-sm font-semibold text-white">
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
          <p className="mb-8 text-center text-xs font-semibold tracking-widest text-white/30 uppercase">
            Trusted by companies across Indonesia
          </p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {clients.map((client) => (
              <span
                key={client}
                className="cursor-default text-sm font-semibold text-white/25 transition-colors duration-200 hover:text-white/50"
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
