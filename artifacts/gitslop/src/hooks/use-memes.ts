import { useListMemes } from "@workspace/api-client-react";

/**
 * Re-exports the generated API hook with standardized configuration
 * for the gallery implementation.
 */
export function useMemesGallery(limit = 50, offset = 0) {
  return useListMemes(
    { limit, offset },
    {
      query: {
        queryKey: ["memes", limit, offset],
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchInterval: 60_000,
        refetchOnWindowFocus: false,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      }
    }
  );
}
