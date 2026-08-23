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
  description: z.string().optional(),
});
