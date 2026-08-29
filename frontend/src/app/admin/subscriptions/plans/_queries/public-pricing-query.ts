import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryPublicPricing() {
  return {
    queryKey: ["get-public-pricing"],
    queryFn: async () => {
      try {
        const [accountTypesRes, plansRes] = await Promise.all([
          gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.PUBLIC_ACCOUNT_TYPE}`),
          gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.PUBLIC_SUBSCRIPTION_PLAN}`),
        ]);

        const accountTypes = accountTypesRes.data?.results || [];
        const allPlans = plansRes.data?.results || [];

        const combinedPricing = accountTypes.map((at: { id: string; benefits: unknown; [key: string]: unknown }) => {
          let parsedBenefits: string[] = [];
          try {
            if (typeof at.benefits === 'string') {
              parsedBenefits = JSON.parse(at.benefits);
            } else if (Array.isArray(at.benefits)) {
              parsedBenefits = at.benefits;
            }
          } catch {
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
    },
  };
}

export const useGetPublicPricing = () => {
  const {
    data: pricingData,
    isLoading: isPricingDataLoading,
    isError: isPricingDataError,
    refetch: refetchPricingData,
    error: pricingDataError,
  } = useQuery({
    ...queryPublicPricing(),
  });

  return {
    pricingData,
    isPricingDataLoading,
    isPricingDataError,
    refetchPricingData,
    pricingDataError,
  };
};
