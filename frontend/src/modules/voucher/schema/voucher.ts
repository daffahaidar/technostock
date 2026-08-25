import { z } from "zod";

export const VoucherSchema = z.object({
  code: z.string().min(1, { message: "Kode voucher harus diisi" }),
  discount_percentage: z.number().min(0).max(100, { message: "Diskon maksimal 100%" }),
  max_discount_amount: z.number().min(0, { message: "Maksimal diskon tidak boleh negatif" }),
  expires_at: z.date({
    required_error: "Tanggal dan jam expired harus diisi",
  }),
  quota: z.number().nullable().optional(),
});

export type VoucherType = z.infer<typeof VoucherSchema> & {
  id: string;
  used_quota: number;
  created_at: string;
  updated_at: string;
};
