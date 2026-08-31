import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { signUpSchema } from "../schema";
import { gatewayAPI, getErrorMessage } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";


export const useSignUp = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: {
    meta?: { message: string };
    message?: string;
  }) => void;
}) => {
  return useMutation({
    mutationKey: ["sign-up"],
    mutationFn: async (body: {
      values?: z.infer<typeof signUpSchema>;
      provider: "email" | "github" | "google";
      callbackUrl?: string;
    }) => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      if (body.provider === "email") {
        if (!body.values) {
          throw new Error("Values are required for email sign up");
        }

        try {
          // Verify backend is alive
          await fetch(`${API_URL}/api/v1/auth/sign-up`, {
            method: "HEAD",
            mode: "no-cors",
            signal: AbortSignal.timeout(5000),
          });
        } catch {
          throw new Error("Server Backend tidak aktif");
        }

        // Call the API Gateway for Register
        try {
          const { data } = await gatewayAPI.post(
            `${ENDPOINT.AUTH_SERVICE.SIGN_UP}`,
            {
              name: body.values.name,
              email: body.values.email,
              password: body.values.password,
            },
          );
          return data;
        } catch (error) {
          throw new Error(
            getErrorMessage(error, "Gagal melakukan registrasi"),
          );
        }
      } else {
        // OAuth logic (reuse same as sign in)
        let targetUrl = `${API_URL}/api/v1/auth/${body.provider}`;
        if (body.callbackUrl) {
          targetUrl += `?callbackUrl=${encodeURIComponent(body.callbackUrl)}`;
          document.cookie = `oauth_callback_url=${encodeURIComponent(
            body.callbackUrl
          )}; path=/; max-age=1800; samesite=lax`;
        }

        try {
          await fetch(targetUrl, {
            method: "HEAD",
            mode: "no-cors",
            signal: AbortSignal.timeout(5000),
          });

          window.open(targetUrl, "_self");
        } catch {
          throw new Error("Server Backend tidak aktif");
        }

        return new Promise<unknown>(() => {});
      }
    },
    onSuccess,
    onError,
  });
};
