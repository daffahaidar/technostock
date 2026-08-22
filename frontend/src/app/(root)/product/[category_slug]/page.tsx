import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductPlanList from "../_components/product-plan-list";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { queryData } from "@/hooks/use-query";
import { externalBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";
import { getQueryClient } from "@/configs/tanstack-query";

// ─── Skeleton hero (used in Suspense fallback) ────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-20 pt-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="mx-auto mb-3 h-5 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mx-auto mb-4 h-10 w-64 animate-pulse rounded-lg bg-white/10" />
          <div className="mx-auto h-4 w-96 animate-pulse rounded bg-white/10" />
        </div>
      </div>
      {/* Cards skeleton */}
      <div className="mx-auto max-w-5xl -translate-y-10 px-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border bg-card p-6 space-y-4 h-72"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero banner ──────────────────────────────────────────────────────────────
function PricingHero({
  categorySlug,
  sn,
}: {
  categorySlug: string;
  sn?: string;
}) {
  // Prettify the slug → title (e.g. "smart-lock" → "Smart Lock")
  const categoryName = categorySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pb-28 pt-20 text-white">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        {/* Breadcrumb-style badge */}
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Pilih Plan
        </span>

        <h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          {categoryName}
        </h1>
        <p className="mx-auto max-w-xl text-base text-slate-300/80">
          Pilih paket layanan yang sesuai kebutuhanmu. Semua plan sudah
          termasuk garansi dan dukungan teknis.
        </p>

        {/* SN info pill */}
        {sn && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm">
            <span className="font-mono text-indigo-300">{sn}</span>
            <span className="text-slate-500">·</span>
            <span>Serial Number</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Prefetched server component ──────────────────────────────────────────────
async function PrefetchedProductPlan({
  params,
  searchParams,
}: {
  params: Promise<{ category_slug: string }>;
  searchParams: Promise<{ sn?: string }>;
}) {
  const { category_slug } = await params;
  const { sn } = await searchParams;

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery(
      queryData({
        queryKey: ["get-product-plan-by-category", category_slug],
        endpoint: `${ENDPOINT.GOLANG_API.PUBLIC_PRODUCT_PLAN}?slug=${category_slug}`,
        source: externalBackend,
      }),
    );
  } catch (error: any) {
    if (error.response?.status === 404) {
      notFound();
    }
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      <PricingHero categorySlug={category_slug} sn={sn} />

      {/* Plans float up over the hero */}
      <section className="mx-auto max-w-5xl -translate-y-12 px-4 pb-16">
        {/* Section subtitle */}
        <div className="mb-8 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Semua Plan
          </h2>
          <div className="mx-auto mt-2 h-px w-12 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
        </div>

        <HydrationBoundary state={dehydratedState}>
          <ProductPlanList categorySlug={category_slug} sn={sn} />
        </HydrationBoundary>

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Harga sudah termasuk PPN. Garansi uang kembali 30 hari.
        </p>
      </section>
    </>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default async function CategoryProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ category_slug: string }>;
  searchParams: Promise<{ sn?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PrefetchedProductPlan params={params} searchParams={searchParams} />
    </Suspense>
  );
}
