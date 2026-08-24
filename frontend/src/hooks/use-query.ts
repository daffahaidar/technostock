import { useQuery } from "@tanstack/react-query";
import { externalBackend, messageBackend } from "@/libs/axios";

type QuerySource = typeof externalBackend | typeof messageBackend;

export function queryData({
  queryKey,
  endpoint,
  source,
  param,
  params,
  token,
}: {
  queryKey: string[];
  endpoint: string | ((param: string | number) => string);
  source: QuerySource;
  param?: string | number;
  params?: Record<string, unknown>;
  token?: string;
}) {
  const finalQueryKey = param !== undefined ? [...queryKey, param] : queryKey;

  return {
    queryKey: finalQueryKey,
    queryFn: async () => {
      let finalEndpoint = typeof endpoint === "function" ? endpoint(param as string | number) : endpoint;
      if (typeof finalEndpoint === "string" && param !== undefined) {
        finalEndpoint = finalEndpoint.replace(":id", String(param));
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const { data } = await source.get(finalEndpoint, { headers, params });
      return data;
    },
  };
}

export const useQueryData = ({
  queryKey,
  endpoint,
  source,
  param,
  params,
}: {
  queryKey: string[];
  endpoint: string | ((param: string | number) => string);
  source: QuerySource;
  param?: string | number;
  params?: Record<string, unknown>;
}) => {
  const { data, isLoading, isError, refetch } = useQuery({
    ...queryData({ queryKey, endpoint, source, param, params }),
  });

  return {
    data,
    isLoading,
    isError,
    refetch,
  };
};
