import { ENDPOINT } from "@/endpoint";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getMembers(token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.MEMBER_MANAGEMENT}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch members: ${res.statusText}`);
    }

    const data = await res.json();
    return { results: data.data || [] };
  } catch (error: unknown) {
    console.error("Error fetching members:", error);
    throw error;
  }
}

export async function promoteToMember(userId: string, planId: string, discordUsername: string, token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.MEMBER_MANAGEMENT}/${userId}/promote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_id: planId, discord_username: discordUsername }),
    });

    if (!res.ok) {
      throw new Error(`Failed to promote member: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: unknown) {
    console.error("Error promoting member:", error);
    throw error;
  }
}

export async function extendSubscription(userId: string, planId: string, token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.MEMBER_MANAGEMENT}/${userId}/extend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ plan_id: planId }),
    });

    if (!res.ok) {
      throw new Error(`Failed to extend subscription: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: unknown) {
    console.error("Error extending subscription:", error);
    throw error;
  }
}

export async function updateUserStatus(userId: string, status: "Active" | "Suspended", token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.RUST_API.USERS}/${userId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update user status: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: unknown) {
    console.error("Error updating user status:", error);
    throw error;
  }
}

export async function revokeMembership(userId: string, token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.MEMBER_MANAGEMENT}/${userId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to revoke membership: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: unknown) {
    console.error("Error revoking membership:", error);
    throw error;
  }
}
