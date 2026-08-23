import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  email: z.email({
    message: "Email tidak valid.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});
