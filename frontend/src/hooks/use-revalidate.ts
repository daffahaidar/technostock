import { useQueryClient, QueryKey } from "@tanstack/react-query";

export const useRevalidateQuery = () => {
  const queryClient = useQueryClient();

  return (...queryKeys: QueryKey[]) => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
};
