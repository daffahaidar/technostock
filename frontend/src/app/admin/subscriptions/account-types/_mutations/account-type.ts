import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";

export const useCreateAccountType = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["create-account-type"],
    mutationFn: async (body: {
      name: string;
      description?: string;
      benefits?: string;
    }) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.ACCOUNT_TYPE}`,
        body,
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

export const useUpdateAccountType = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["update-account-type"],
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      description?: string;
      benefits?: string;
      is_recommended?: boolean;
    }) => {
      const response = await gatewayAPI.patch(
        `${ENDPOINT.MAIN_SERVICE.ACCOUNT_TYPE}/${id}`,
        body,
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

export const useDeleteAccountType = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["delete-account-type"],
    mutationFn: async (id: string) => {
      const response = await gatewayAPI.delete(
        `${ENDPOINT.MAIN_SERVICE.ACCOUNT_TYPE}/${id}`,
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
