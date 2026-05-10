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
      className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden"
      id="hero"
    >
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(0,0,0,0))]" />

      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
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
              <span className="inline-flex items-center gap-2 border border-white/20 text-white/70 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur-sm bg-white/5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Next-Generation Hardware Solutions
              </span>
            </div>

            {/* Headline */}
            <h1
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 text-5xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight"
              style={{ transitionDelay: "200ms" }}
            >
              Smart Hardware
              <br />
              <span className="bg-gradient-to-r from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                for Modern
              </span>
              <br />
              Business.
            </h1>

            {/* Sub-headline */}
            <p
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 text-white/60 text-lg lg:text-xl leading-relaxed max-w-lg"
              style={{ transitionDelay: "350ms" }}
            >
              From intelligent queue management and precision digital scales to
              automated climate control — Technorider delivers enterprise-grade
              hardware built to scale with your operations.
            </p>

            {/* CTAs */}
            <div
              className="fade-up opacity-0 translate-y-6 transition-all duration-700 flex flex-wrap gap-4"
              style={{ transitionDelay: "500ms" }}
            >
              <Link
                href="#services"
                className="group inline-flex items-center gap-2 bg-white text-black font-semibold px-7 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
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
                className="inline-flex items-center gap-2 border border-white/25 text-white/90 font-medium px-7 py-3.5 rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-300"
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
                { value: "500+", label: "Businesses Served" },
                { value: "99.9%", label: "Uptime Guarantee" },
                { value: "24/7", label: "Support" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="text-2xl font-bold text-white">
                    {stat.value}
                  </span>
                  <span className="text-white/50 text-sm">{stat.label}</span>
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
              <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-3xl scale-90 translate-y-8" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/hero-kiosk.png"
                  alt="Technorider Smart Queue Management Kiosk"
                  width={600}
                  height={600}
                  className="w-full object-cover"
                  priority
                />
              </div>
              {/* Floating tag */}
              <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-xl">
                <p className="text-white text-xs font-medium">
                  Queue Management System
                </p>
                <p className="text-white/50 text-xs mt-0.5">
                  Real-time digital display
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
        <span className="text-xs font-medium tracking-widest uppercase">
          Scroll
        </span>
        <svg
          className="w-4 h-4"
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
