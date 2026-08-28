"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 text-white">
      {/* ── Decorative background ─────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Large ambient blobs */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-700/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Glowing 404 */}
        <div className="relative select-none">
          <span
            className="text-[10rem] font-black leading-none tracking-tighter sm:text-[14rem]"
            style={{
              background:
                "linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 60px rgba(99,102,241,0.4))",
            }}
          >
            404
          </span>
          {/* Subtle glow ring behind number */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-48 w-80 rounded-full bg-indigo-500/10 blur-3xl sm:h-64 sm:w-[480px]" />
          </div>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-sm">
          <Search className="h-3.5 w-3.5" />
          Halaman tidak ditemukan
        </span>

        {/* Title & description */}
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Oops, kamu nyasar nih!
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Halaman yang kamu cari tidak ada, sudah dipindahkan, atau mungkin
            URL-nya salah ketik. Jangan khawatir, yuk kembali ke jalur yang
            benar.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          <Button
            asChild
            className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-violet-700"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Halaman Utama
            </Link>
          </Button>
        </div>

        {/* Divider */}
        <div className="mt-4 flex items-center gap-3 text-xs text-slate-600">
          <div className="h-px w-16 bg-white/10" />
          <span>AngelTrade</span>
          <div className="h-px w-16 bg-white/10" />
        </div>
      </div>
    </div>
  );
}
