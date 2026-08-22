import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { queryData } from "@/hooks/use-query";
import { externalBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";
import { getQueryClient } from "@/configs/tanstack-query";
import OrderSummary from "../../_components/order-summary";

// ─── Skeleton fallback ────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero bar */}
      <div className="h-48 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
      {/* Card placeholder */}
      <div className="mx-auto max-w-lg -translate-y-12 px-4">
        <div className="animate-pulse rounded-2xl border border-border bg-card p-6 space-y-4 h-80" />
      </div>
    </div>
  );
}

// ─── Prefetched server component ──────────────────────────────────────────────
async function PrefetchedProductPlan({
  params,
  searchParams,
}: {
  params: Promise<{ category_slug: string; plan_slug: string }>;
  searchParams: Promise<{ sn?: string }>;
}) {
  const { category_slug, plan_slug } = await params;
  const { sn } = await searchParams;

  const queryClient = getQueryClient();

  try {
    await queryClient.fetchQuery(
      queryData({
        queryKey: [
          "get-product-plan-by-category-plan",
          category_slug,
          plan_slug,
        ],
        endpoint: `${ENDPOINT.GOLANG_API.PUBLIC_PRODUCT_PLAN_DETAIL}/${category_slug}/${plan_slug}`,
        source: externalBackend,
      }),
    );
  } catch (error: any) {
    if (error.response?.status === 404) {
      notFound();
    }
  }

  const dehydratedState = dehydrate(queryClient);

  // Prettify slugs for display
  const categoryName = category_slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const planName = plan_slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pb-28 pt-20 text-white">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl px-4 text-center">
          {/* Breadcrumb badge */}
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            {categoryName}
            <span className="text-white/30">›</span>
            {planName}
          </span>

          <h1 className="mb-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Konfirmasi Pesanan
          </h1>
          <p className="text-sm text-slate-300/70">
            Periksa detail pesananmu dan selesaikan pembayaran
          </p>
        </div>
      </div>

      {/* ── Order card ────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg -translate-y-12 px-4 pb-16">
        <HydrationBoundary state={dehydratedState}>
          <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-black/5 ring-1 ring-border">
            <OrderSummary
              planSlug={plan_slug}
              categorySlug={category_slug}
              sn={sn}
            />
          </div>
        </HydrationBoundary>

        {/* Security badge row */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
          <span>🔒 SSL Encrypted</span>
          <span>·</span>
          <span>⚡ Midtrans Secured</span>
          <span>·</span>
          <span>✅ Garansi 30 Hari</span>
        </div>
      </div>
    </>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default async function CategoryProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ category_slug: string; plan_slug: string }>;
  searchParams: Promise<{ sn?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PrefetchedProductPlan params={params} searchParams={searchParams} />
    </Suspense>
  );
}
