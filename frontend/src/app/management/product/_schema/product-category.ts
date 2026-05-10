import { z } from "zod";

export const productCategorySchema = z.object({
  name: z.string().min(1, {
    message: "Nama kategori harus diisi.",
  }),
  description: z.string().optional(),
});
