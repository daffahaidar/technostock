import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryMidtransBalance(accessToken: string) {
  return {
    queryKey: ["get-finance-balance"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.FINANCE_BALANCE}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    },
  };
}

export const useGetMidtransBalance = (accessToken: string) => {
  const {
    data: balanceData,
    isLoading: isBalanceDataLoading,
    isError: isBalanceDataError,
    refetch: refetchBalanceData,
    error: balanceDataError,
  } = useQuery({
    ...queryMidtransBalance(accessToken),
  });

  return {
    balanceData,
    isBalanceDataLoading,
    isBalanceDataError,
    refetchBalanceData,
    balanceDataError,
  };
};
