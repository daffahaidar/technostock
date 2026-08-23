import { ENDPOINT } from "@/endpoint";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function getSubscriptionPlans(token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.SUBSCRIPTION_PLAN}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch subscription plans: ${res.statusText}`);
    }

    const data = await res.json();
    return { results: data.results || [] };
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    throw error;
  }
}

export async function createSubscriptionPlan(
  data: {
    account_type_id: string;
    name: string;
    duration_months: number;
    price: number;
    description?: string;
  },
  token: string
) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.SUBSCRIPTION_PLAN}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Failed to create subscription plan: ${res.statusText}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Error creating subscription plan:", error);
    throw error;
  }
}

export async function deleteSubscriptionPlan(id: string, token: string) {
  try {
    const res = await fetch(`${API_URL}${ENDPOINT.GOLANG_API.SUBSCRIPTION_PLAN}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete subscription plan: ${res.statusText}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting subscription plan:", error);
    throw error;
  }
}
