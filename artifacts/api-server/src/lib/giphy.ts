interface GiphyImage {
  url: string;
  mp4?: string;
}

interface GiphyGif {
  images: {
    original: GiphyImage;
    downsized: GiphyImage;
  };
}

interface GiphyResponse {
  data: GiphyGif[];
  pagination?: {
    count: number;
    total_count: number;
  };
}

export async function searchGiphy(
  query: string,
  apiKey: string,
): Promise<string | null> {
  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  url.searchParams.set("rating", "pg-13");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Giphy API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as GiphyResponse;
  if (!data.data?.length) return null;

  const pick = data.data[Math.floor(Math.random() * data.data.length)];
  return pick.images.original.url;
}
