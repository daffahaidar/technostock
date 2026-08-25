import { z } from "zod";

export const subscriptionPlanSchema = z.object({
  account_type_id: z.string().min(1, {
    message: "Tipe Akun harus dipilih.",
  }),
  name: z.string().min(1, {
    message: "Nama plan harus diisi.",
  }),
  duration_months: z.coerce.number().min(0, {
    message: "Durasi minimal 0 (0 untuk lifetime).",
  }),
  price: z.coerce.number().min(0, {
    message: "Harga tidak boleh negatif.",
  }),
  quota: z.coerce.number().nullable().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.duration_months === 0 && (data.quota === null || data.quota === undefined || data.quota <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Kuota wajib diisi untuk plan lifetime.",
  path: ["quota"],
});
