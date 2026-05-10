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
      className="py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
          <span className="inline-block text-black/40 text-xs font-semibold tracking-[0.2em] uppercase mb-8">
            Ready to Scale?
          </span>
        </div>

        <h2 className="reveal opacity-0 translate-y-8 transition-all duration-700 text-5xl lg:text-7xl font-bold text-black tracking-tight leading-[1.05] mb-8">
          Upgrade your business
          <br />
          <span className="text-black/25">with smart hardware.</span>
        </h2>

        <p className="reveal opacity-0 translate-y-8 transition-all duration-700 text-black/50 text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          Join hundreds of businesses across Indonesia that trust Technorider
          to automate, optimize, and future-proof their operations.
        </p>

        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 flex flex-wrap justify-center gap-4 mb-20">
          <Link
            href="mailto:hello@technorider.id"
            className="group inline-flex items-center gap-2 bg-black text-white font-semibold px-8 py-4 rounded-full hover:bg-black/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,0,0,0.15)]"
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
            className="inline-flex items-center gap-2 border-2 border-black/15 text-black/80 font-medium px-8 py-4 rounded-full hover:border-black/30 hover:bg-black/5 transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            +62 21 1234 5678
          </Link>
        </div>

        {/* Contact form */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 max-w-2xl mx-auto bg-black rounded-3xl p-8 text-left shadow-2xl">
          <h3 className="text-white font-semibold text-lg mb-6">Send us a message</h3>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2 block">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2 block">Company</label>
                <input
                  type="text"
                  placeholder="Company name"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2 block">Message</label>
              <textarea
                rows={4}
                placeholder="Tell us about your needs..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-200 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-xl hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
