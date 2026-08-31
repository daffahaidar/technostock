import { useQueryClient, QueryKey } from "@tanstack/react-query";

export const useRevalidateQuery = () => {
  const queryClient = useQueryClient();

  return (...queryKeys: QueryKey[]) => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };
};

// Dipakai saat logout: seluruh cache dibuang, bukan cuma di-invalidate, supaya
// data user sebelumnya tidak sempat terlihat oleh user berikutnya di browser
// yang sama.
export const useClearQueryCache = () => {
  const queryClient = useQueryClient();

  return () => queryClient.clear();
};
