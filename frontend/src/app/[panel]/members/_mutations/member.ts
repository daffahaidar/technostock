import { useMutation } from "@tanstack/react-query";
import { type AxiosError } from "axios";
import { gatewayAPI } from "@/libs/axios";
import { ENDPOINT } from "@/endpoint";
import z from "zod";
import { membershipPlanSchema } from "../_schemas/membership";

export const useBanMember = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["ban-member"],
    mutationFn: async (body: { userId: string; status: string }) => {
      const response = await gatewayAPI.patch(
        `${ENDPOINT.AUTH_SERVICE.USERS}/${body.userId}/status`,
        {
          status: body.status,
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

export const useRemoveMembership = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["remove-membership"],
    mutationFn: async (body: { userId: string; status: string }) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.MEMBER_MANAGEMENT}/${body.userId}/revoke`,
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

export const usePromoteMember = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["promote-member"],
    mutationFn: async (body: z.infer<typeof membershipPlanSchema>) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.MEMBER_MANAGEMENT}/${body.user_id}/promote`,
        {
          plan_id: body.plan_id,
          discord_username: body.discord_username,
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

export const useExtendMembership = ({
  onSuccess,
  onError,
  accessToken,
}: {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: AxiosError) => void;
  accessToken: string;
}) => {
  return useMutation({
    mutationKey: ["extend-membership"],
    mutationFn: async (body: { userId: string; planId: string }) => {
      const response = await gatewayAPI.post(
        `${ENDPOINT.MAIN_SERVICE.MEMBER_MANAGEMENT}/${body.userId}/extend`,
        {
          plan_id: body.planId,
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
