import { useInfiniteQuery } from "@tanstack/react-query";

import { messageBackend } from "@/libs/axios";

export function queryGetChatHistory(accessToken?: string, limit: number = 20) {
  return {
    queryKey: ["get-chat-history"],
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      if (!accessToken) return null;
      let url = `/api/v1/chat/history?limit=${limit}`;
      if (pageParam) {
        url += `&cursor=${pageParam}`;
      }
      const { data } = await messageBackend.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return data?.results ?? [];
    },
    getNextPageParam: (lastPage: any[]) => {
      if (lastPage && lastPage.length === limit) {
        return lastPage[0].id;
      }
      return null;
    },
    initialPageParam: null as string | null,
    enabled: !!accessToken,
  };
}

export const useGetChatHistory = (accessToken?: string) => {
  const {
    data: chatHistoryData,
    isLoading: isChatHistoryDataLoading,
    isError: isChatHistoryDataError,
    refetch: refetchChatHistoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...queryGetChatHistory(accessToken),
  });

  return {
    chatHistoryData,
    isChatHistoryDataLoading,
    isChatHistoryDataError,
    refetchChatHistoryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
