import { generateMemeQuery } from "./meme-query.js";

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
    offset: number;
  };
}

async function searchGiphyWithQuery(
  query: string,
  apiKey: string,
): Promise<string | null> {
  const countUrl = new URL("https://api.giphy.com/v1/gifs/search");
  countUrl.searchParams.set("api_key", apiKey);
  countUrl.searchParams.set("q", query);
  countUrl.searchParams.set("limit", "1");
  countUrl.searchParams.set("rating", "pg-13");

  const countRes = await fetch(countUrl.toString());
  if (!countRes.ok) return null;

  const countData = (await countRes.json()) as GiphyResponse;
  const total = countData.pagination?.total_count ?? 0;
  if (total === 0) return null;

  const maxOffset = Math.min(total - 1, 49);
  const offset = Math.floor(Math.random() * maxOffset);

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");
  url.searchParams.set("offset", String(offset));
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

export async function searchGiphy(
  keyword: string,
  apiKey: string,
): Promise<string | null> {
  const aiQuery = await generateMemeQuery(keyword);

  const result = await searchGiphyWithQuery(aiQuery, apiKey);
  if (result) return result;

  return searchGiphyWithQuery(`${keyword} meme`, apiKey);
}
