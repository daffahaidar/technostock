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
    title: "Queue Machine Systems",
    description:
      "Intelligent ticketing and digital queue displays that streamline customer flow in banks, clinics, retail, and government offices. Reduce wait times by up to 40%.",
    tags: ["Touchscreen Kiosk", "LED Display", "Cloud-Connected"],
    accent: "from-blue-500 to-cyan-500",
    glow: "group-hover:shadow-blue-500/20",
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
    title: "Digital Weighing Solutions",
    description:
      "High-precision industrial and retail digital scales with automatic data capture, seamless ERP integration, and anti-tampering certification for factories and warehouses.",
    tags: ["High Precision", "ERP Integration", "Anti-Tamper"],
    accent: "from-violet-500 to-purple-500",
    glow: "group-hover:shadow-violet-500/20",
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
    title: "Climate Control Systems",
    description:
      "Smart IoT-based temperature and humidity monitoring for cold storage, server rooms, and production floors — with real-time alerts and automated response protocols.",
    tags: ["IoT Sensors", "Real-time Alerts", "Remote Control"],
    accent: "from-emerald-500 to-teal-500",
    glow: "group-hover:shadow-emerald-500/20",
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
      className="relative overflow-hidden bg-black py-32"
    >
      {/* Subtle separator line */}
      <div className="absolute top-0 left-1/2 h-20 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="reveal mb-20 translate-y-8 text-center opacity-0 transition-all duration-700">
          <span className="mb-5 inline-block text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
            What We Do
          </span>
          <h2 className="text-4xl leading-tight font-bold tracking-tight text-white lg:text-6xl">
            Solutions Built for
            <br />
            <span className="bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
              Enterprise Scale.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
            We design and deploy hardware systems that integrate seamlessly into
            your operations, reducing friction and increasing throughput.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={`reveal group relative translate-y-8 cursor-pointer rounded-3xl border border-white/10 bg-white/[0.03] p-8 opacity-0 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl ${service.glow}`}
              style={{ transitionDelay: `${index * 120}ms` }}
            >
              {/* Icon */}
              <div
                className={`inline-flex rounded-2xl bg-gradient-to-br p-3 ${service.accent} bg-opacity-10 mb-6 text-white transition-transform duration-300 group-hover:scale-110`}
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
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
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hover arrow */}
              <div className="absolute top-8 right-8 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                <svg
                  className="h-5 w-5 text-white/60"
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
