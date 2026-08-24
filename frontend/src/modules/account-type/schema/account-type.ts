import { z } from "zod";

export const accountTypeSchema = z.object({
  name: z.string().min(1, {
    message: "Nama tipe akun harus diisi.",
  }),
  description: z.string().optional(),
  benefits: z.array(
    z.object({
      value: z.string().min(1, { message: "Benefit tidak boleh kosong." }),
    })
  ).optional(),
});
