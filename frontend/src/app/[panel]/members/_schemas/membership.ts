import { z } from "zod";

export const membershipPlanSchema = z.object({
  user_id: z.string().min(1, {
    message: "User ID harus diisi.",
  }),
  plan_id: z.string().min(1, {
    message: "Plan ID harus dipilih.",
  }),
  discord_username: z.string().min(1, {
    message: "Discord Username harus diisi.",
  }),
});
