"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQueryData } from "@/hooks/use-query";
import { ENDPOINT } from "@/endpoint";
import { externalBackend } from "@/libs/axios";
import { CheckCircle2, Zap, Star, Shield } from "lucide-react";

// ─── Icon mapping per plan index ────────────────────────────────────────────
const PLAN_ICONS = [Shield, Zap, Star];
const PLAN_ACCENTS = [
  {
    gradient: "from-slate-500 to-slate-700",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    ring: "ring-slate-200 dark:ring-slate-700",
    btn: "bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300",
    featured: false,
  },
  {
    gradient: "from-indigo-500 to-violet-600",
    badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    ring: "ring-indigo-400 dark:ring-indigo-500",
    btn: "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/30",
    featured: true,
  },
  {
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ring: "ring-amber-300 dark:ring-amber-600",
    btn: "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-400/30",
    featured: false,
  },
];

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function PlanSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <div className="h-10 w-10 rounded-xl bg-muted" />
          <div className="h-5 w-1/2 rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-3 w-full rounded bg-muted" />
            ))}
          </div>
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Shield className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold">Belum ada plan tersedia</p>
      <p className="text-sm text-muted-foreground">
        Plan untuk kategori ini belum dikonfigurasi.
      </p>
    </div>
  );
}

// ─── Individual plan card ─────────────────────────────────────────────────────
function PlanCard({
  plan,
  index,
  categorySlug,
  sn,
}: {
  plan: any;
  index: number;
  categorySlug: string;
  sn?: string;
}) {
  const accent = PLAN_ACCENTS[index % PLAN_ACCENTS.length];
  const Icon = PLAN_ICONS[index % PLAN_ICONS.length];

  const formattedPrice = plan.price
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(plan.price)
    : "Gratis";

  // Parse features from description (split by newline or bullet)
  const features: string[] =
    plan.features ||
    (plan.description
      ? plan.description
          .split(/\n|•/)
          .map((f: string) => f.trim())
          .filter(Boolean)
      : []);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl
        ${accent.featured ? `ring-2 ${accent.ring}` : "ring-1 ring-border"}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Featured badge */}
      {accent.featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-0.5 text-xs font-semibold text-white shadow-md">
            <Star className="h-3 w-3 fill-white" />
            Most Popular
          </span>
        </div>
      )}

      {/* Icon header */}
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent.gradient}`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>

      {/* Name & description */}
      <h3 className="text-lg font-bold">{plan.name}</h3>
      {!features.length && plan.description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {plan.description}
        </p>
      )}

      {/* Price */}
      <div className="mt-4 mb-5">
        <span className="text-3xl font-extrabold tracking-tight">
          {formattedPrice}
        </span>
        {plan.price > 0 && (
          <span className="ml-1 text-sm text-muted-foreground">/plan</span>
        )}
      </div>

      {/* Feature list */}
      {features.length > 0 && (
        <ul className="mb-6 flex-grow space-y-2">
          {features.map((feat, fi) => (
            <li key={fi} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              <span className="text-muted-foreground">{feat}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-2">
        <Button
          asChild
          className={`w-full font-semibold transition-all duration-200 ${accent.btn}`}
        >
          <Link
            href={`/product/${categorySlug}/${plan.slug}${sn ? `?sn=${sn}` : ""}`}
          >
            Pilih Plan
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ProductPlanList({
  categorySlug,
  sn,
}: {
  categorySlug: string;
  sn?: string;
}) {
  const { data: dataPlan, isLoading } = useQueryData({
    queryKey: ["get-product-plan-by-category", categorySlug],
    endpoint: `${ENDPOINT.GOLANG_API.PUBLIC_PRODUCT_PLAN}?slug=${categorySlug}`,
    source: externalBackend,
  });

  const plans: any[] = dataPlan?.results || [];

  if (isLoading) return <PlanSkeleton />;
  if (plans.length === 0) return <EmptyState />;

  return (
    <div
      className={`grid grid-cols-1 gap-6 ${
        plans.length === 2
          ? "sm:grid-cols-2 max-w-2xl mx-auto"
          : plans.length >= 3
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : ""
      }`}
    >
      {plans.map((plan, i) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          index={i}
          categorySlug={categorySlug}
          sn={sn}
        />
      ))}
    </div>
  );
}
