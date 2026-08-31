import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export const useCreatePlan = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["create-plan"],
    mutationFn: async (body: {
      account_type_id: string;
      name: string;
      duration_months: number;
      price: number;
      quota?: number | null;
      description?: string;
    }) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.SUBSCRIPTION_PLAN}`,
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

export const useDeletePlan = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["delete-plan"],
    mutationFn: async (id: string) => {
      const response = await gatewayAPI.delete(
        `${ENDPOINT.MAIN_SERVICE.SUBSCRIPTION_PLAN}/${id}`,
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
