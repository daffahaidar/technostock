"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = heroRef.current?.querySelectorAll(".fade-up");
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center bg-luxury-black overflow-hidden"
      id="hero"
    >
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(212,175,55,0.15),rgba(10,10,10,1))]" />

      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(212,175,55,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.2) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#F3CA52]/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 pt-40">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left – Text Content */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div
              className="fade-up opacity-0 translate-y-6 transition-all duration-700"
              style={{ transitionDelay: "100ms" }}
            >
              <span className="inline-flex items-center gap-2 border border-[#D4AF37]/30 text-white/80 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-sm bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                <span className="w-1.5 h-1.5 bg-[#F3CA52] rounded-full animate-pulse shadow-[0_0_8px_#F3CA52]" />
                Edukasi Trading Saham #1 di Indonesia
              </span>
            </div>

            {/* Headline */}
            <h1
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 text-5xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight"
              style={{ transitionDelay: "200ms" }}
            >
              Kuasai<br />
              <span className="text-gradient-gold">
                Pasar Saham
              </span>
              <br />
              Bersama Ahli.
            </h1>

            {/* Sub-headline */}
            <p
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 text-white/60 text-lg lg:text-xl leading-relaxed max-w-lg"
              style={{ transitionDelay: "350ms" }}
            >
              Mulai perjalanan trading dan investasi saham Anda dengan kurikulum terstruktur,
              komunitas eksklusif, dan mentor berpengalaman di AngelTrade.
            </p>

            {/* CTAs */}
            <div
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 flex flex-wrap gap-4"
              style={{ transitionDelay: "500ms" }}
            >
              <Link
                href="#services"
                className="group inline-flex items-center gap-2 bg-gradient-gold px-7 py-3.5 rounded-full hover:brightness-110 transition-all duration-300 hover:scale-105 active:scale-95 gold-glow font-bold"
              >
                Get Started
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
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
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 border border-[#D4AF37]/50 text-[#F9E596] font-medium px-7 py-3.5 rounded-full hover:bg-[#D4AF37]/10 transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>

            {/* Stats row */}
            <div
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 flex flex-wrap gap-8 pt-4 border-t border-white/10"
              style={{ transitionDelay: "650ms" }}
            >
              {[
                { value: "50.000+", label: "Trader Terlatih" },
                { value: "90%", label: "Win Rate Analisa" },
                { value: "24/7", label: "Grup Mentoring" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="text-2xl font-bold text-[#F9E596]">
                    {stat.value}
                  </span>
                  <span className="text-white/60 text-sm font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right – Product Mockup */}
          <div
            className="fade-up opacity-0 translate-y-6 transition-all duration-700 relative flex justify-center"
            style={{ transitionDelay: "300ms" }}
          >
            <div className="relative w-full max-w-lg">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-3xl blur-[80px] scale-90 translate-y-8" />
              <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <Image
                  src="/hero-dashboard.jpg"
                  alt="AngelTrade Trading Dashboard"
                  width={600}
                  height={600}
                  className="w-full object-cover"
                  priority
                />
              </div>
              {/* Floating tag */}
              <div className="absolute -bottom-4 -left-4 glass-card-gold rounded-2xl px-4 py-3">
                <p className="text-[#F9E596] text-xs font-semibold">
                  Platform Belajar Interaktif
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Akses materi seumur hidup
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#D4AF37]/50 animate-bounce">
        <span className="text-xs font-medium tracking-widest uppercase">
          Scroll
        </span>
        <svg
          className="w-4 h-4 text-[#D4AF37]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
