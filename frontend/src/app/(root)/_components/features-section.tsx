"use client";

import { useEffect, useRef } from "react";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "High Precision Hardware",
    description: "Industrial-grade sensors and components calibrated to international standards. Accuracy you can stake your operations on.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Reliable & Scalable Systems",
    description: "Engineered for 99.9% uptime. From a single branch to a nationwide network, our systems scale without friction.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    title: "Custom Integration Support",
    description: "Every system integrates with your existing ERP, CRM, or POS. Our engineers handle the hard parts so you don't have to.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Real-time Monitoring",
    description: "Live dashboards, instant alerts, and historical analytics — all accessible from any device, anywhere in the world.",
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
      className="py-32 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left – Text */}
          <div>
            <div className="reveal opacity-0 translate-y-8 transition-all duration-700">
              <span className="inline-block text-black/40 text-xs font-semibold tracking-[0.2em] uppercase mb-5">
                Why Technorider
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold text-black tracking-tight leading-tight">
                Built differently.
                <br />
                Designed to last.
              </h2>
              <p className="mt-6 text-black/50 text-lg leading-relaxed">
                We don&apos;t just sell hardware — we engineer long-term
                operational excellence. Every product is built with durability,
                intelligence, and your business continuity in mind.
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-black text-base mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-black/50 text-sm leading-relaxed">
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
              <div className="bg-black rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-white/50 text-sm font-medium">
                    System Health
                  </span>
                  <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    All systems operational
                  </span>
                </div>

                {/* Metrics */}
                {[
                  { label: "Queue System", value: "A147", sub: "Now serving", progress: 78 },
                  { label: "Scale Accuracy", value: "±0.1g", sub: "Precision level", progress: 99 },
                  { label: "Climate Control", value: "22.5°C", sub: "Server room temp", progress: 45 },
                  { label: "Uptime", value: "99.9%", sub: "Last 30 days", progress: 99.9 },
                ].map((metric) => (
                  <div key={metric.label} className="mb-6 last:mb-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-white/60 text-xs">{metric.label}</span>
                      <div className="text-right">
                        <span className="text-white text-sm font-semibold">{metric.value}</span>
                        <span className="text-white/30 text-xs ml-2">{metric.sub}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                        style={{ width: `${metric.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30">
                Live Dashboard
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
