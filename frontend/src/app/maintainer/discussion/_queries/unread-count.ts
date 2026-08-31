import { useQuery } from "@tanstack/react-query";
import { messageBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export function queryChatUnreadCount(accessToken?: string, enabled = true) {
  return {
    queryKey: ["get-chat-unread-count"],
    queryFn: async () => {
      const { data } = await messageBackend.get(
        `${ENDPOINT.MESSAGE_SERVICE.CHAT_UNREAD_COUNT}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return data;
    },
    enabled: enabled && !!accessToken,
    // Chat service boleh mati (fitur on-hold) — jangan spam retry.
    retry: false,
  };
}

export const useGetChatUnreadCount = (accessToken?: string, enabled = true) => {
  const {
    data: chatUnreadCountData,
    isLoading: isChatUnreadCountDataLoading,
    isError: isChatUnreadCountDataError,
    refetch: refetchChatUnreadCountData,
  } = useQuery({
    ...queryChatUnreadCount(accessToken, enabled),
  });

  return {
    chatUnreadCountData,
    isChatUnreadCountDataLoading,
    isChatUnreadCountDataError,
    refetchChatUnreadCountData,
  };
};
