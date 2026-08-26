
export const queryClientOptions = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 15 * 60 * 1000, // 15 minutes - how long data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - how long inactive data is kept
      retry: 1, // number of retry attempts on failure
      retryDelay: 3000, // 3 seconds between retry attempts
      refetchOnReconnect: true,
      structuralSharing: true, // enable structural sharing between query results
    },
  },
};
