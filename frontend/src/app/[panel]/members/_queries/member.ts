import { useQuery } from "@tanstack/react-query";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryMembers(accessToken: string) {
  return {
    queryKey: ["get-members"],
    queryFn: async () => {
      const { data } = await gatewayAPI.get(`${ENDPOINT.MAIN_SERVICE.MEMBER_MANAGEMENT}`,{
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data;
    },
  };
}

export const useGetMembers = (accessToken: string) => {
  const {
    data: membersData,
    isLoading: isMembersDataLoading,
    isError: isMembersDataError,
    refetch: refetchMembersData,
    error: membersDataError,
  } = useQuery({
    ...queryMembers(accessToken),
  });

  return {
    membersData,
    isMembersDataLoading,
    isMembersDataError,
    refetchMembersData,
    membersDataError,
  };
};
