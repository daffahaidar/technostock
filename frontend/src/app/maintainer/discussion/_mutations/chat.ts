import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { messageBackend } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export const useMarkChatRead = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken?: string;
}) => {
  return useMutation({
    mutationKey: ["mark-chat-read"],
    mutationFn: async () => {
      const response = await messageBackend.post(
        `${ENDPOINT.MESSAGE_SERVICE.CHAT_READ}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response?.data;
    },
    onSuccess,
    onError,
  });
};
