"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const products = [
  {
    name: "QueuePro X1",
    category: "Queue Management",
    description: "Touchscreen kiosk with thermal printer and cloud dashboard.",
    badge: "Best Seller",
    badgeColor: "bg-blue-500",
  },
  {
    name: "ScaleMaster Pro",
    category: "Digital Weighing",
    description: "Industrial precision scale with auto-tare and ERP sync.",
    badge: "New",
    badgeColor: "bg-emerald-500",
  },
  {
    name: "ClimaGuard IoT",
    category: "Climate Control",
    description: "Multi-sensor climate monitor with automated HVAC control.",
    badge: "Popular",
    badgeColor: "bg-violet-500",
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
      className="relative overflow-hidden bg-black py-32"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,rgba(99,102,241,0.08),transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="reveal mb-20 translate-y-8 text-center opacity-0 transition-all duration-700">
          <span className="mb-5 inline-block text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
            Product Lineup
          </span>
          <h2 className="text-4xl font-bold tracking-tight text-white lg:text-6xl">
            The hardware that
            <br />
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
              runs your business.
            </span>
          </h2>
        </div>

        {/* Featured showcase */}
        <div className="reveal mb-12 translate-y-8 opacity-0 transition-all duration-700">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
            <div className="grid gap-0 lg:grid-cols-2">
              {/* Image */}
              <div className="relative flex min-h-[400px] items-center justify-center bg-zinc-900/50 p-12 lg:min-h-[500px]">
                <Image
                  src="/product-showcase.png"
                  alt="Technorider Product Lineup"
                  width={500}
                  height={400}
                  className="w-full max-w-md object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center p-12">
                <span className="mb-4 text-xs font-semibold tracking-widest text-white/40 uppercase">
                  Complete System
                </span>
                <h3 className="mb-4 text-3xl leading-tight font-bold text-white">
                  The Technorider
                  <br />
                  Business Suite
                </h3>
                <p className="mb-8 leading-relaxed text-white/50">
                  Three integrated hardware solutions working together in
                  harmony. Queue, weigh, and monitor — all from one unified
                  platform with a single dashboard to rule them all.
                </p>

                <div className="mb-8 space-y-4">
                  {[
                    "Unified management dashboard",
                    "Cross-device data sync",
                    "Enterprise API access",
                    "24/7 remote monitoring",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10">
                        <svg
                          className="h-3 w-3 text-white"
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
                  className="inline-flex items-center gap-2 self-start rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:scale-105 hover:bg-white/90"
                >
                  Request a Demo
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
              className="reveal group relative translate-y-8 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-6 opacity-0 transition-all duration-700 hover:border-white/20 hover:bg-white/[0.06]"
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium tracking-wider text-white/40 uppercase">
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
              <div className="mt-5 flex items-center gap-2 text-xs text-white/40 transition-colors group-hover:text-white/60">
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
