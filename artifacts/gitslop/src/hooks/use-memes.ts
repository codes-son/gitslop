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
        queryKey: [],
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
      }
    }
  );
}
