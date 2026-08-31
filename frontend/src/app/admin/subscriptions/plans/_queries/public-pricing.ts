import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryPublicPricing() {
  return {
    queryKey: ["get-public-pricing"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(
        `${ENDPOINT.MAIN_SERVICE.PUBLIC_PRICING}`,
      );
      return data;
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
