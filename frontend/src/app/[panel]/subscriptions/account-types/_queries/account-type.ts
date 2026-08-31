import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryAccountTypes(accessToken: string) {
  return {
    queryKey: ["get-account-types"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.ACCOUNT_TYPE}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    },
  };
}

export const useGetAccountTypes = (accessToken: string) => {
  const {
    data: accountTypesData,
    isLoading: isAccountTypesDataLoading,
    isError: isAccountTypesDataError,
    refetch: refetchAccountTypesData,
    error: accountTypesDataError,
  } = useQuery({
    ...queryAccountTypes(accessToken),
  });

  return {
    accountTypesData,
    isAccountTypesDataLoading,
    isAccountTypesDataError,
    refetchAccountTypesData,
    accountTypesDataError,
  };
};
