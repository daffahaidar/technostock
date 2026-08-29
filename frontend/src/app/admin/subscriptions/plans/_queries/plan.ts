import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryPlanSubscription(accessToken: string) {
  return {
    queryKey: ["get-subscription-plans"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(
        `${ENDPOINT.MAIN_SERVICE.SUBSCRIPTION_PLAN}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return data;
    },
  };
}

export const useGetPlanSubscription = (accessToken: string) => {
  const {
    data: planSubscriptionData,
    isLoading: isPlanSubscriptionDataLoading,
    isError: isPlanSubscriptionDataError,
    refetch: refetchPlanSubscriptionData,
    error: planSubscriptionDataError,
  } = useQuery({
    ...queryPlanSubscription(accessToken),
  });

  return {
    planSubscriptionData,
    isPlanSubscriptionDataLoading,
    isPlanSubscriptionDataError,
    refetchPlanSubscriptionData,
    planSubscriptionDataError,
  };
};
