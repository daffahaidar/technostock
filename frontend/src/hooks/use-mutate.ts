import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { golangBackend, rustBackend, messageBackend } from "@/libs/axios";

export const useMutateData = <TSchema extends z.ZodTypeAny>({
  onSuccess,
  onError,
  mutationKey,
  endpoint,
  source,
  method,
}: {
  mutationKey: string[];
  endpoint: string | ((param: string | number) => string);
  source: typeof golangBackend | typeof rustBackend | typeof messageBackend;
  method: "post" | "put" | "delete" | "patch";
  schema?: TSchema;
  onSuccess?: (data: Record<string, any>) => void;
  onError?: (error: any) => void;
}) => {
  return useMutation({
    mutationKey,
    mutationFn: async (
      variables: {
        body?: TSchema extends z.ZodTypeAny ? z.infer<TSchema> : any;
        param?: string | number;
      } = {},
    ) => {
      try {
        let finalEndpoint =
          typeof endpoint === "function"
            ? endpoint(variables.param as string | number)
            : endpoint;

        if (
          typeof finalEndpoint === "string" &&
          variables.param !== undefined
        ) {
          finalEndpoint = finalEndpoint.replace(":id", String(variables.param));
        }

        let response;
        if (method === "delete") {
          response = await source.delete(finalEndpoint, {
            data: variables.body,
          });
        } else {
          response = await source[method](finalEndpoint, variables.body);
        }
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess,
    onError,
  });
};
