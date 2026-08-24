"use server";

import { ENDPOINT } from "@/endpoint";

export async function getPublicPricingData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${ENDPOINT.GOLANG_API.PUBLIC_ACCOUNT_TYPE}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          tags: ["public-account-types"],
          revalidate: 60,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch public account types");
    }

    const accountTypesData = await res.json();
    const accountTypes = accountTypesData.results || [];

    const plansRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${ENDPOINT.GOLANG_API.PUBLIC_SUBSCRIPTION_PLAN}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: {
          tags: ["public-subscription-plans"],
          revalidate: 60,
        },
      }
    );

    if (!plansRes.ok) {
      throw new Error("Failed to fetch public subscription plans");
    }

    const plansData = await plansRes.json();
    const allPlans = plansData.results || [];

    // Combine account types with their respective plans
    const combinedPricing = accountTypes.map((at: { id: string; benefits: unknown; [key: string]: unknown }) => {
      // Parse benefits string into array if it's a string, or parse if it's JSON string inside string
      let parsedBenefits = [];
      try {
        if (typeof at.benefits === 'string') {
          parsedBenefits = JSON.parse(at.benefits);
        } else if (Array.isArray(at.benefits)) {
          parsedBenefits = at.benefits;
        }
      } catch {
        // Fallback for comma separated if JSON.parse fails
        if (typeof at.benefits === 'string') {
          parsedBenefits = at.benefits.split(',').map((s: string) => s.trim());
        }
      }

      return {
        ...at,
        parsedBenefits,
        plans: allPlans.filter((plan: { account_type_id: string }) => plan.account_type_id === at.id),
      };
    });

    return combinedPricing;
  } catch (error) {
    console.error("Error fetching public pricing data:", error);
    return [];
  }
}
