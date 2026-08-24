import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/app/auth/sign-in/_handlers/client";
import { signInSchema } from "../_components/sign-in";
import { z } from "zod";

export const useSignIn = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: {
    meta: {
      message: string;
    };
  }) => void;
}) => {
  return useMutation({
    mutationKey: ["sign-in"],
    mutationFn: async (body: {
      values?: z.infer<typeof signInSchema>;
      provider: "email" | "github" | "google";
      callbackUrl?: string;
    }) => {
      if (body.provider === "email") {
        if (!body.values) {
          throw new Error("Values are required for email sign in");
        }

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        try {
          await fetch(`${API_URL}/api/v1/auth/sign-in`, {
            method: "HEAD",
            mode: "no-cors",
            signal: AbortSignal.timeout(5000), // 5s timeout
          });
        } catch {
          throw new Error("Server Backend tidak aktif");
        }

        const response = await authClient.signIn.email({
          email: body.values.email,
          password: body.values.password,
        });

        if (response.error) {
          throw response.error;
        }

        return response.data as Record<string, unknown>;
      } else {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        
        let targetUrl = `${API_URL}/api/v1/auth/${body.provider}`;
        if (body.callbackUrl) {
          targetUrl += `?callbackUrl=${encodeURIComponent(body.callbackUrl)}`;
          // Store callback URL in a cookie so the callback route can read it
          document.cookie = `oauth_callback_url=${encodeURIComponent(body.callbackUrl)}; path=/; max-age=1800; samesite=lax`;
        }

        try {
          // Check if backend is reachable before redirecting
          await fetch(targetUrl, {
            method: "HEAD",
            mode: "no-cors",
            signal: AbortSignal.timeout(5000), // 5s timeout
          });

          window.open(targetUrl, "_self");
        } catch {
          throw new Error("Server Backend tidak aktif");
        }

        // Return a promise that never resolves to keep isPending true until redirect
        return new Promise<Record<string, unknown>>(() => {});
      }
    },
    onSuccess,
    onError,
  });
};

