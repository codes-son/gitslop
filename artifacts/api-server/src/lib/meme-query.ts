import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return null;
  if (!client) {
    client = new OpenAI({ baseURL, apiKey });
  }
  return client;
}

export async function generateMemeQuery(keyword: string): Promise<string> {
  const openai = getClient();
  if (!openai) return `${keyword} meme`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 30,
      messages: [
        {
          role: "system",
          content:
            "You are a meme search expert. Given a developer's GitHub comment snippet, return a short 2-5 word Giphy search query that will find a funny, highly relevant reaction meme. Return ONLY the search query, nothing else. Examples: 'this is fine fire' for stress, 'math lady confused' for confusion, 'this is brilliant spongebob' for sarcastic praise.",
        },
        {
          role: "user",
          content: keyword,
        },
      ],
    });

    const query = res.choices[0]?.message?.content?.trim();
    return query && query.length > 0 ? query : `${keyword} meme`;
  } catch {
    return `${keyword} meme`;
  }
}
