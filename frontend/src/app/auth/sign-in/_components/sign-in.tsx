"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSignIn } from "../_mutations/sign-in";
import Link from "next/link";

export const signInSchema = z.object({
  email: z.email({
    message: "Email tidak valid.",
  }),
  password: z.string().min(1, {
    message: "Password harus diisi.",
  }),
});
export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/forum/dashboard";

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isPending, mutate: signIn } = useSignIn({
    onSuccess: (result: unknown) => {
      const data = result as { user?: { role?: string } };
      const role = data?.user?.role || "User";
      switch (role) {
        case "Maintainer":
          router.push(callbackUrl || "/maintainer/dashboard");
          break;
        case "Admin":
        case "SuperAdmin":
          router.push(callbackUrl || "/admin/dashboard");
          break;
        case "Member":
          router.push(callbackUrl || "/forum/dashboard");
          break;
        case "User":
          router.push(callbackUrl || "/");
          break;
        default:
          router.push("/");
      }
    },
    onError: (error: unknown) => {
      const err = error as { meta?: { message?: string }; message?: string };
      let message =
        err?.meta?.message || err?.message || "Terjadi kesalahan";
      
      if (message === "Forbidden") {
        message = "Akun anda telah di suspend, silahkan hubungi Admin";
      }
      
      toast.error(message);
    },
  });

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      const errorMessages: Record<string, string> = {
        oauth_failed: "Login OAuth gagal. Silakan coba lagi.",
        oauth_error: "Terjadi kesalahan saat login OAuth.",
        missing_params: "Parameter OAuth tidak lengkap.",
        invalid_provider: "Provider OAuth tidak valid.",
        no_token: "Gagal mendapatkan token. Silakan coba lagi.",
        access_denied: "Akses ditolak oleh pengguna.",
      };
      const message =
        errorMessages[oauthError] || "Terjadi kesalahan saat login OAuth.";
      toast.error(message);

      // Optional: Clear the error from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  return (
    <Card className="overflow-hidden p-0 glass-panel-gold shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[#D4AF37]/30">
      <CardContent className="p-0">
        <Form {...form}>
          <form
            className="p-6 md:p-8"
            onSubmit={form.handleSubmit((values) =>
              signIn({ values, provider: "email" }),
            )}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-gradient-gold rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] mb-2">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-black fill-current">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-[#F9E596]">Welcome back</h1>
                <p className="text-white/60 text-balance text-sm">
                  Sign in to your Technostock account
                </p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="example@mail.com" 
                        {...field} 
                        className="bg-[#0a0a0a]/50 border-[#D4AF37]/20 text-[#F9E596] placeholder:text-white/30 focus-visible:border-[#D4AF37]/50 focus-visible:ring-[#D4AF37]/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Your password"
                          type={showPassword ? "text" : "password"}
                          className="pr-10 bg-[#0a0a0a]/50 border-[#D4AF37]/20 text-[#F9E596] placeholder:text-white/30 focus-visible:border-[#D4AF37]/50 focus-visible:ring-[#D4AF37]/30"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent text-white/50 hover:text-white/80"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                          </span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Field>
                <Button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-gradient-gold text-black font-bold hover:brightness-110 gold-glow transition-all"
                >
                  {isPending ? "Signing In..." : "Sign In"}
                </Button>
              </Field>
              <FieldSeparator className="text-white/40 *:data-[slot=field-separator-content]:bg-[#121212] *:data-[slot=field-separator-content]:px-2 text-xs before:bg-white/10 after:bg-white/10">
                Atau lanjutkan dengan
              </FieldSeparator>
              <Field className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  disabled={isPending}
                  onClick={() => signIn({ provider: "github" })}
                  className="border-[#D4AF37]/20 text-white/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all bg-transparent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Sign in with Github</span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isPending}
                  onClick={() => signIn({ provider: "google" })}
                  className="border-[#D4AF37]/20 text-white/80 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all bg-transparent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Sign in with Google</span>
                </Button>
              </Field>
              <FieldDescription className="text-center text-white/50 text-xs">
                Don&apos;t have an account? <Link href="/auth/sign-up" className="text-[#D4AF37] hover:text-[#F3CA52] font-medium transition-colors ml-1">Sign Up</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
