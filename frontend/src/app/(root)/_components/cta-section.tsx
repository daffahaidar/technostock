"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function CtaSection() {
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
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-32 bg-luxury-black relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
          <span className="inline-block text-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase mb-8">
            Siap Mencetak Profit?
          </span>
        </div>

        <h2 className="reveal opacity-0 translate-y-8 transition-all duration-700 text-5xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-8">
          Mulai perjalanan trading Anda
          <br />
          <span className="text-gradient-gold">bersama Technostock.</span>
        </h2>

        <p className="reveal opacity-0 translate-y-8 transition-all duration-700 text-white/60 text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          Bergabunglah dengan ribuan trader di seluruh Indonesia yang telah membuktikan 
          metode kami dan meraih kebebasan finansial.
        </p>

        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 flex flex-wrap justify-center gap-4 mb-20">
          <Link
            href="mailto:hello@technostock.id"
            className="group inline-flex items-center gap-2 bg-gradient-gold text-black font-bold px-8 py-4 rounded-full hover:brightness-110 transition-all duration-300 hover:scale-105 active:scale-95 gold-glow"
          >
            Get in Touch
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="tel:+6221-1234-5678"
            className="inline-flex items-center gap-2 border-2 border-[#D4AF37]/50 text-[#F9E596] font-medium px-8 py-4 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            +62 21 1234 5678
          </Link>
        </div>

        {/* Contact form */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 max-w-2xl mx-auto glass-panel-gold rounded-3xl p-8 text-left">
          <h3 className="text-[#F9E596] font-semibold text-lg mb-6">Send us a message</h3>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[#D4AF37]/70 text-xs font-medium uppercase tracking-wider mb-2 block">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full bg-[#0a0a0a] border border-[#D4AF37]/20 text-[#F9E596] placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#121212] transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-[#D4AF37]/70 text-xs font-medium uppercase tracking-wider mb-2 block">Company</label>
                <input
                  type="text"
                  placeholder="Company name"
                  className="w-full bg-[#0a0a0a] border border-[#D4AF37]/20 text-[#F9E596] placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#121212] transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="text-[#D4AF37]/70 text-xs font-medium uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full bg-[#0a0a0a] border border-[#D4AF37]/20 text-[#F9E596] placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#121212] transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-[#D4AF37]/70 text-xs font-medium uppercase tracking-wider mb-2 block">Message</label>
              <textarea
                rows={4}
                placeholder="Tell us about your needs..."
                className="w-full bg-[#0a0a0a] border border-[#D4AF37]/20 text-[#F9E596] placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-[#121212] transition-all duration-200 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-gold text-black font-bold text-sm py-3.5 rounded-xl hover:brightness-110 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2 gold-glow"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
