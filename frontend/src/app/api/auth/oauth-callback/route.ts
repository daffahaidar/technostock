import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ROLE_DASHBOARDS: Record<string, string> = {
  Maintainer: "/maintainer/dashboard",
  Admin: "/admin/dashboard",
  SuperAdmin: "/admin/dashboard",
  Member: "/forum/dashboard",
  User: "/",
};

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.url;
  const provider = req.nextUrl.searchParams.get("provider");
  const code = req.nextUrl.searchParams.get("code");

  if (!provider || !code) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=missing_params", baseUrl),
    );
  }

  if (!["github", "google"].includes(provider)) {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=invalid_provider", baseUrl),
    );
  }

  try {
    // Forward the authorization code to the Rust backend callback endpoint
    const backendUrl = `${AUTH_SERVICE_URL}/api/v1/auth/${provider}/callback?code=${encodeURIComponent(code)}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      redirect: "manual", // Don't follow redirects
    });

    if (!response.ok) {
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=oauth_failed", baseUrl),
      );
    }

    const data = await response.json();

    if (!data.results?.access_token) {
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=no_token", baseUrl),
      );
    }

    const { access_token, refresh_token, expires_in } = data.results;

    // Decode JWT to determine user role for dashboard redirect
    const claims = decodeJwt(access_token);
    const role = (claims?.role as string) || "User";
    
    // Check if there is a saved callback URL in cookies
    const callbackCookie = req.cookies.get("oauth_callback_url");
    const savedCallbackUrl = callbackCookie?.value ? decodeURIComponent(callbackCookie.value) : null;
    
    // Use saved callback URL or fallback to role dashboard
    const dashboardUrl = savedCallbackUrl || ROLE_DASHBOARDS[role] || "/forum/dashboard";

    // Create redirect response to the target URL
    const redirectResponse = NextResponse.redirect(
      new URL(dashboardUrl, baseUrl),
    );

    // Clean up the callback cookie if it exists
    if (savedCallbackUrl) {
      redirectResponse.cookies.delete("oauth_callback_url");
    }

    // Set JWT cookies
    redirectResponse.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expires_in || 900,
    });

    redirectResponse.cookies.set("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return redirectResponse;
  } catch {
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth_error", baseUrl),
    );
  }
}
