import { z } from "zod";

export const productPlanSchema = z.object({
  name: z.string().min(1, {
    message: "Nama plan harus diisi.",
  }),
  description: z.string().optional(),
  price: z.number().min(1, {
    message: "Harga harus diisi.",
  }),
  category_id: z.uuid(),
});
