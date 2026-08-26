"use server";

import { cookies } from "next/headers";
import { getSession } from "@/app/auth/sign-in/_handlers/server";

export async function processCheckout(planId: string, returnUrl: string, discordUsername?: string, voucherCode?: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // SERVER_GATEWAY_URL dipakai saat jalan di dalam container: dari sana
  // "localhost:8080" menunjuk ke container frontend sendiri, bukan API gateway.
  const API_URL =
    process.env.SERVER_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";
  
  const res = await fetch(`${API_URL}/api/v1/main/subscriptions/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      plan_id: planId,
      return_url: returnUrl,
      discord_username: discordUsername || "",
      voucher_code: voucherCode || ""
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.meta?.message || data?.error || "Gagal membuat transaksi, silakan coba lagi.");
  }

  return data;
}

export async function checkVoucher(code: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  // SERVER_GATEWAY_URL dipakai saat jalan di dalam container: dari sana
  // "localhost:8080" menunjuk ke container frontend sendiri, bukan API gateway.
  const API_URL =
    process.env.SERVER_GATEWAY_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";
  
  const res = await fetch(`${API_URL}/api/v1/main/public/vouchers/check/${code}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.meta?.message || data?.error || "Gagal mengecek voucher.");
  }

  return data.results;
}
