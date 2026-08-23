"use server";

import { cookies } from "next/headers";
import { getSession } from "@/app/auth/sign-in/_handlers/server";

export async function processCheckout(planId: string, returnUrl: string, discordUsername?: string) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  
  const res = await fetch(`${API_URL}/api/v1/main/subscriptions/buy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      plan_id: planId,
      return_url: returnUrl,
      discord_username: discordUsername || ""
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.meta?.message || data?.error || "Gagal membuat transaksi, silakan coba lagi.");
  }

  return data;
}
