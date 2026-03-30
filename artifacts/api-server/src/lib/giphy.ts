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
  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("offset", "0");
  url.searchParams.set("rating", "pg-13");
  url.searchParams.set("sort", "relevant");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
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
