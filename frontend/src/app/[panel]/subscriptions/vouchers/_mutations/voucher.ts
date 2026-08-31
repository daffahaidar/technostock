import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";
import { z } from "zod";
import { VoucherSchema } from "../_schemas/voucher";

export const useCreateVoucher = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["create-voucher"],
    mutationFn: async (body: z.infer<typeof VoucherSchema>) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.VOUCHER}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response?.data;
    },
    onSuccess,
    onError,
  });
};

export const useDeleteVoucher = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["delete-voucher"],
    mutationFn: async (id: string) => {
      const response = await gatewayAPI.delete(
        `${ENDPOINT.MAIN_SERVICE.VOUCHER}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response?.data;
    },
    onSuccess,
    onError,
  });
};
