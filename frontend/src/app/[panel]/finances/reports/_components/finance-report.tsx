"use client";

import { useGetMidtransBalance } from "../_queries/finances";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";

import { isAxiosError } from "axios";

export default function FinanceReport() {
  const { data: sessionData } = authClient.useSession();
  const token = sessionData?.session?.token || "";
  const {
    balanceData,
    isBalanceDataLoading,
    isBalanceDataError,
    balanceDataError,
  } = useGetMidtransBalance(token);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isBalanceDataLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Balance
            </CardTitle>
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[200px]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isBalanceDataError) {
    let errorMessage =
      balanceDataError?.message || "Failed to fetch data from Midtrans.";

    if (
      isAxiosError(balanceDataError) &&
      balanceDataError.response?.data?.details
    ) {
      errorMessage = balanceDataError.response.data.details;
    }

    return (
      <div className="rounded-lg border border-red-900 bg-red-900/20 p-4 text-sm text-red-400">
        <h4 className="mb-1 font-semibold">Error Fetching Balance</h4>
        <p className="break-all">{errorMessage}</p>
      </div>
    );
  }

  // Handle midtrans balance response structure. Midtrans Merchant Balance typically has "balance" or similar fields.
  // We'll safely render the data stringified if it's unknown, or format if known.
  // For standard Iris it has { balance: "10000" }.
  const balanceRaw = balanceData?.data?.balance;
  const balanceValue =
    typeof balanceRaw === "string" ? parseFloat(balanceRaw) : balanceRaw || 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-gold-600/30 relative overflow-hidden bg-slate-900">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={80} />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Balance
            </CardTitle>
            <Wallet className="text-gold-500 h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {balanceRaw !== undefined ? formatRupiah(balanceValue) : "N/A"}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Gross Revenue (Internal Calculation)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
