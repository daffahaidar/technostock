import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryVouchers(accessToken: string) {
  return {
    queryKey: ["get-vouchers"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.VOUCHER}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    },
  };
}

export const useGetVouchers = (accessToken: string) => {
  const {
    data: vouchersData,
    isLoading: isVouchersDataLoading,
    isError: isVouchersDataError,
    refetch: refetchVouchersData,
    error: vouchersDataError,
  } = useQuery({
    ...queryVouchers(accessToken),
  });

  return {
    vouchersData,
    isVouchersDataLoading,
    isVouchersDataError,
    refetchVouchersData,
    vouchersDataError,
  };
};
