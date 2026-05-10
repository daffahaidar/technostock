import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

// Define protected routes and their required roles
// Using simpler string matching here, but could use regex for more complex patterns
const PROTECTED_ROUTES = [
  { path: "/management", role: "SuperAdmin" },
  { path: "/admin", role: "Admin" },
  { path: "/maintainer", role: "Maintainer" },
  { path: "/forum", role: "User" },
  { path: "/user", role: null }, // Requires login, any role can access
];

// Role-based dashboard mapping
const ROLE_DASHBOARDS: Record<string, string> = {
  SuperAdmin: "/management/dashboard",
  Admin: "/admin/dashboard",
  Maintainer: "/maintainer/dashboard",
  User: "/forum/dashboard",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the route is protected or if it's an auth route we want to redirect away from if logged in
  const isAuthRoute = pathname.startsWith("/auth");
  const isProtectedRoute =
    pathname.startsWith("/management") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintainer") ||
    pathname.startsWith("/forum") ||
    pathname.startsWith("/user");

  // If it's a public route and not an auth route, let it pass (e.g., landing page "/")
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // 2. Get the tokens
  let accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // 2.5 Attempt Silent Refresh if Access is missing/expired but Refresh exists
  let refreshedCookies: {
    access: string;
    refresh: string;
    maxAge: number;
  } | null = null;
  if (!accessToken && refreshToken) {
    try {
      const RUST_API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const refreshRes = await fetch(`${RUST_API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.results && data.results.access_token) {
          accessToken = data.results.access_token;
          refreshedCookies = {
            access: data.results.access_token,
            refresh: data.results.refresh_token || refreshToken,
            maxAge: data.results.expires_in || 15 * 60,
          };
        }
      }
    } catch (e) {
      console.error("Middleware token refresh failed:", e);
    }
  }

  // 3. Handle Auth Routes (Sign In / Sign Up)
  if (isAuthRoute) {
    if (accessToken) {
      try {
        const claims = decodeJwt(accessToken);
        const role = (claims.role as string) || "User";
        const dashboardUrl = ROLE_DASHBOARDS[role] || "/forum/dashboard";

        // If logged in, redirect to their dashboard
        const response = NextResponse.redirect(
          new URL(dashboardUrl, request.url),
        );
        if (refreshedCookies) {
          response.cookies.set("access_token", refreshedCookies.access, {
            maxAge: refreshedCookies.maxAge,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
          response.cookies.set("refresh_token", refreshedCookies.refresh, {
            maxAge: 7 * 24 * 60 * 60,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
        }
        return response;
      } catch (e) {
        // Invalid token, delete it and let them access auth page
        const response = NextResponse.next();
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        return response;
      }
    }
    // Not logged in, allow access to auth page
    return NextResponse.next();
  }

  // 4. Handle Protected Routes
  if (isProtectedRoute) {
    if (!accessToken) {
      // Not logged in, redirect to sign-in
      const url = new URL("/auth/sign-in", request.url);
      url.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    try {
      const claims = decodeJwt(accessToken);
      const userRole = (claims.role as string) || "User";

      // Check specific role requirements
      let finalResponse = NextResponse.next();

      if (pathname.startsWith("/management") && userRole !== "SuperAdmin") {
        finalResponse = NextResponse.redirect(
          new URL(ROLE_DASHBOARDS[userRole] || "/", request.url),
        );
      } else if (pathname.startsWith("/admin") && userRole !== "Admin") {
        finalResponse = NextResponse.redirect(
          new URL(ROLE_DASHBOARDS[userRole] || "/", request.url),
        );
      } else if (pathname.startsWith("/maintainer") && userRole !== "Maintainer") {
        finalResponse = NextResponse.redirect(
          new URL(ROLE_DASHBOARDS[userRole] || "/", request.url),
        );
      }

      if (refreshedCookies) {
        finalResponse.cookies.set("access_token", refreshedCookies.access, {
          maxAge: refreshedCookies.maxAge,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
        finalResponse.cookies.set("refresh_token", refreshedCookies.refresh, {
          maxAge: 7 * 24 * 60 * 60,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }

      return finalResponse;
    } catch (e) {
      // Token invalid
      const url = new URL("/auth/sign-in", request.url);
      const response = NextResponse.redirect(url);
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
