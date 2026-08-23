import { ENDPOINT } from "@/endpoint";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getAccountTypes(token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.ACCOUNT_TYPE}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch account types: ${res.statusText}`);
    }

    const data = await res.json();
    return { results: data.results || [] };
  } catch (error: any) {
    console.error("Error fetching account types:", error);
    throw error;
  }
}

export async function createAccountType(
  data: { name: string; description?: string; benefits?: string },
  token: string
) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.ACCOUNT_TYPE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create account type: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Error creating account type:", error);
    throw error;
  }
}

export async function updateAccountType(
  id: string,
  data: { name?: string; description?: string; benefits?: string; is_recommended?: boolean },
  token: string
) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.ACCOUNT_TYPE}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to update account type: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Error updating account type:", error);
    throw error;
  }
}

export async function deleteAccountType(id: string, token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.ACCOUNT_TYPE}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete account type: ${res.statusText}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting account type:", error);
    throw error;
  }
}
