"use server";

import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  redirect("/auth/sign-in");
}

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const claims = decodeJwt(accessToken);

    if (!claims || (claims.exp && claims.exp * 1000 < Date.now())) {
      return null;
    }

    return {
      user: {
        id: claims.sub as string,
        email: claims.email as string,
        name: (claims.name as string) || "",
        role: (claims.role as string) || "User",
        phone: (claims.phone as string) || null,
        avatar_url: (claims.avatar_url as string) || null,
        discord_username: (claims.discord_username as string) || null,
      },
      session: {
        userId: claims.sub as string,
        expiresAt: new Date((claims.exp || 0) * 1000),
        token: accessToken,
      },
    };
  } catch {
    return null;
  }
}
