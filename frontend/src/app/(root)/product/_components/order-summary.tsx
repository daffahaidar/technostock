"use client";

import { useSearchParams } from "next/navigation";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { useSignIn } from "@/app/auth/sign-in/_mutations/sign-in";
import { Button } from "@/components/ui/button";
import { ENDPOINT } from "@/endpoint";
import { useQueryData } from "@/hooks/use-query";
import { golangBackend } from "@/libs/axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import {
  CheckCircle2,
  ShoppingCart,
  LogIn,
  ArrowRight,
  Hash,
  Layers,
  Tag,
  FileText,
  Loader2,
  LayoutDashboard,
} from "lucide-react";

interface OrderSummaryProps {
  planSlug: string;
  categorySlug: string;
  sn?: string;
}

// ─── Row item inside summary ──────────────────────────────────────────────────
function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-medium">{value || "—"}</span>
      </div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function OrderSummarySkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="h-5 w-1/3 rounded bg-muted" />
      <div className="space-y-3 divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 pt-3">
            <div className="h-8 w-8 rounded-lg bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="h-3.5 w-32 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 h-px w-full bg-border" />
      <div className="flex justify-between">
        <div className="h-5 w-12 rounded bg-muted" />
        <div className="h-5 w-24 rounded bg-muted" />
      </div>
      <div className="h-11 w-full rounded-lg bg-muted" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderSummary({
  planSlug,
  categorySlug,
  sn,
}: OrderSummaryProps) {
  const { data: sessionData } = authClient.useSession();
  const searchParams = useSearchParams();
  const transactionStatus = searchParams.get("transaction_status");
  const isPaid =
    transactionStatus === "settlement" ||
    transactionStatus === "capture" ||
    transactionStatus === "success";

  const { data: dataPlan, isLoading } = useQueryData({
    queryKey: ["get-product-plan-by-category-plan", categorySlug, planSlug],
    endpoint: `${ENDPOINT.GOLANG_API.PUBLIC_PRODUCT_PLAN_DETAIL}/${categorySlug}/${planSlug}`,
    source: golangBackend,
  });

  const { isPending: isSigningIn, mutate: signIn } = useSignIn({
    onError: (error: any) => {
      const message =
        error?.meta?.message ||
        error?.message ||
        "Terjadi kesalahan saat login";
      toast.error(message);
    },
  });

  const handleLoginGoogle = () => {
    const currentUrl = window.location.pathname + window.location.search;
    signIn({ provider: "google", callbackUrl: currentUrl });
  };

  const { isPending: isCheckingOut, mutate: checkout } = useMutation({
    mutationFn: async () => {
      const { data } = await golangBackend.post(ENDPOINT.GOLANG_API.BUY_PRODUCT, {
        serial_number: sn,
        category: categorySlug,
        plan: planSlug,
        return_url: window.location.href,
      });
      return data;
    },
    onSuccess: (data) => {
      const invoiceUrl = data?.results?.invoice_url;
      if (invoiceUrl) {
        window.location.href = invoiceUrl;
      } else {
        toast.error("Gagal mendapatkan link pembayaran");
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.meta?.message ||
        error.message ||
        "Terjadi kesalahan saat checkout";
      toast.error(message);
    },
  });

  const plan = dataPlan?.results;

  const formattedPrice = plan?.price
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(plan.price)
    : null;

  if (isLoading) return <OrderSummarySkeleton />;

  // ── Paid success state ─────────────────────────────────────────────────────
  if (isPaid) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Pembayaran Berhasil!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Terima kasih. Pesananmu sudah dikonfirmasi.
            </p>
          </div>
        </div>

        {/* Receipt-style summary */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-800/40 dark:bg-emerald-900/20">
          <div className="divide-y divide-emerald-100 dark:divide-emerald-800/30">
            <SummaryRow icon={Hash} label="Serial Number" value={sn} />
            <SummaryRow icon={Layers} label="Kategori" value={plan?.category?.name} />
            <SummaryRow icon={Tag} label="Plan" value={plan?.name} />
          </div>
        </div>

        <Button className="w-full gap-2" asChild>
          <Link href="/forum/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Buka Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  // ── Normal order summary ────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-1">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold">Ringkasan Pesanan</h3>
        <p className="text-xs text-muted-foreground">
          Periksa detail pesananmu sebelum melanjutkan
        </p>
      </div>

      {/* Details */}
      <div className="divide-y divide-border rounded-xl border bg-muted/30 px-4">
        <SummaryRow icon={Hash} label="Serial Number" value={sn} />
        <SummaryRow icon={Layers} label="Kategori" value={plan?.category?.name} />
        <SummaryRow icon={Tag} label="Plan" value={plan?.name} />
        {plan?.description && (
          <SummaryRow icon={FileText} label="Deskripsi" value={plan.description} />
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 mt-3">
        <span className="text-sm text-muted-foreground">Total Pembayaran</span>
        <span className="text-xl font-extrabold tracking-tight">
          {formattedPrice ?? "—"}
        </span>
      </div>

      {/* CTA section */}
      <div className="pt-2 space-y-2">
        {sessionData?.session ? (
          <Button
            className="w-full gap-2 font-semibold"
            onClick={() => checkout()}
            disabled={isCheckingOut || !sn}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Checkout Sekarang
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2 font-semibold"
            onClick={handleLoginGoogle}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Login dengan Google untuk Melanjutkan
              </>
            )}
          </Button>
        )}

        {!sn && sessionData?.session && (
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-destructive">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
            Serial Number diperlukan untuk melanjutkan pembayaran
          </p>
        )}

        <p className="text-center text-[11px] text-muted-foreground/60">
          Pembayaran aman & terenkripsi · Garansi 30 hari
        </p>
      </div>
    </div>
  );
}
