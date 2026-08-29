import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryActiveSubscription(accessToken: string) {
  return {
    queryKey: ["get-active-subscription"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.SUBSCRIPTION_MY_ACTIVE}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    },
    enabled: !!accessToken,
  };
}

export const useGetActiveSubscription = (accessToken: string) => {
  const {
    data: activeSubscriptionData,
    isLoading: isActiveSubscriptionDataLoading,
    isError: isActiveSubscriptionDataError,
    refetch: refetchActiveSubscriptionData,
    error: activeSubscriptionDataError,
  } = useQuery({
    ...queryActiveSubscription(accessToken),
  });

  return {
    activeSubscriptionData,
    isActiveSubscriptionDataLoading,
    isActiveSubscriptionDataError,
    refetchActiveSubscriptionData,
    activeSubscriptionDataError,
  };
};
