import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export const useProcessCheckout = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["process-checkout"],
    mutationFn: async (body: {
      plan_id: string;
      return_url: string;
      discord_username?: string;
      voucher_code?: string;
    }) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.SUBSCRIPTION_BUY}`,
        {
          plan_id: body.plan_id,
          return_url: body.return_url,
          discord_username: body.discord_username || "",
          voucher_code: body.voucher_code || "",
        },
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

export const useCheckVoucher = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["check-voucher"],
    mutationFn: async (code: string) => {
      const response = await gatewayAPI.get(
        `${ENDPOINT.MAIN_SERVICE.PUBLIC_VOUCHER_CHECK(code)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response?.data?.results;
    },
    onSuccess,
    onError,
  });
};
