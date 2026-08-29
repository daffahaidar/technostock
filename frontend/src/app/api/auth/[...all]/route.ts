import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, importSPKI } from "jose";

const AUTH_SERVICE_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/auth", "");

  if (path === "/sign-in/email") {
    try {
      const body = await req.json();
      const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          {
            ...errorData,
            message:
              errorData.meta?.message ||
              errorData.message ||
              "An error occurred",
          },
          { status: response.status },
        );
      }

      const data = await response.json();

      // Expected data structure from Rust:
      // {
      //     "meta": { "status": "success", "message": "success" },
      //     "results": { "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 900 }
      // }

      if (data.results) {
        const { access_token, refresh_token, expires_in } = data.results;
        const claims = await verifyJwt(access_token);

        const res = NextResponse.json({
          status: true,
          user: {
            // We don't have user info in the login response yet,
            // we might need to decode the token or fetch it.
            // For now, we'll decode the token to get the ID/email if possible, or just return success.
            // Better-auth client expects a session/user object on login success usually.
            id: claims?.sub || "placeholder",
            email: claims?.email || body.email,
            name: claims?.name || "",
            role: claims?.role || "user",
            phone: claims?.phone || null,
            avatar_url: claims?.avatar_url || null,
          },
        });

        // Set cookies
        // Access Token - 15 mins
        res.cookies.set("access_token", access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: expires_in, // 15 mins
        });

        // Refresh Token - 7 days (604800 seconds)
        res.cookies.set("refresh_token", refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        return res;
      }

      return NextResponse.json(
        { status: false, error: "Invalid response from backend" },
        { status: 500 },
      );
    } catch (error) {
      console.error("Login Proxy Error:", error);
      return NextResponse.json(
        { status: false, error: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  if (path === "/sign-out") {
    const res = NextResponse.json({ status: true });
    res.cookies.delete("access_token");
    res.cookies.delete("refresh_token");
    return res;
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.pathname.replace("/api/auth", "");

  if (path === "/get-session") {
    const accessToken = req.cookies.get("access_token")?.value;
    const refreshToken = req.cookies.get("refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(null);
    }

    if (accessToken) {
      // Validate access token (simulated locally or call backend/verify if needed)
      // Ideally we decode it to get expiration and user ID.
      try {
        // If we can't verify signature easily (secret sharing issues), we can just decode payload if we trust the cookie (httpOnly).
        // Or call an endpoint on Rust to 'me'.
        // For now, let's assumes if it exists it's valid, or let the client fail on next request.
        // BUT better-auth `useSession` needs user data.

        // Let's verify the token properly using RS256 public key
        const claims = await verifyJwt(accessToken);
        if (claims && claims.exp && claims.exp * 1000 > Date.now()) {
          return NextResponse.json({
            user: {
              id: claims.sub,
              email: claims.email,
              name: claims.name,
              role: claims.role,
              phone: claims.phone,
              avatar_url: claims.avatar_url,
            },
            session: {
              userId: claims.sub,
              expiresAt: new Date(claims.exp * 1000),
              token: accessToken,
            },
          });
        }
      } catch {
        // Token invalid
      }
    }

    // If access token is missing or invalid/expired, try refresh
    if (refreshToken) {
      try {
        const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.results) {
            const {
              access_token,
              refresh_token: new_refresh_token,
              expires_in,
            } = data.results;

            // Decode new access token to get user info
            const claims = await verifyJwt(access_token);

            const res = NextResponse.json({
              user: {
                id: claims?.sub || "unknown",
                email: claims?.email || "user@example.com",
                name: claims?.name || "",
                role: claims?.role || "user",
                phone: claims?.phone || null,
                avatar_url: claims?.avatar_url || null,
              },
              session: {
                userId: claims?.sub || "unknown",
                expiresAt: new Date((claims?.exp || 0) * 1000),
                token: access_token,
              },
            });

            res.cookies.set("access_token", access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
              maxAge: expires_in,
            });

            // Optionally update refresh token if rotated
            if (new_refresh_token) {
              res.cookies.set("refresh_token", new_refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
              });
            }

            return res;
          }
        }
      } catch {
        console.error("Refresh Token Error");
      }
    }

    return NextResponse.json(null);
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

interface TokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  phone?: string;
  avatar_url?: string;
  exp?: number;
  [key: string]: unknown;
}
async function verifyJwt(token: string): Promise<TokenPayload | null> {
  try {
    const publicKeyEnv = process.env.JWT_PUBLIC_KEY;
    if (publicKeyEnv) {
      const publicKey = await importSPKI(publicKeyEnv.replace(/\\n/g, "\n"), "RS256");
      const { payload } = await jwtVerify(token, publicKey);
      return payload;
    }
    // Fallback just decoding (not recommended but for fallback)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
