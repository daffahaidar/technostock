import { VoucherType } from "../schema/voucher";
import { z } from "zod";
import { VoucherSchema } from "../schema/voucher";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getVouchers = async (token: string): Promise<VoucherType[]> => {
  const res = await fetch(`${API_URL}/api/v1/main/vouchers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch vouchers");
  const data = await res.json();
  return data.results || [];
};

export const createVoucher = async (data: z.infer<typeof VoucherSchema>, token: string) => {
  const res = await fetch(`${API_URL}/api/v1/main/vouchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create voucher");
  const responseData = await res.json();
  return responseData.results;
};

export const deleteVoucher = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/api/v1/main/vouchers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to delete voucher");
  return await res.json();
};
