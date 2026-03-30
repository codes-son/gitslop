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
          content: `You are a brainrot meme search expert for developers. Given a GitHub comment, return the BEST 2-4 word Giphy search query to find a hilarious, viral, instantly-recognizable reaction GIF.

Prioritize well-known internet meme formats:
- Reaction faces: "skill issue", "cope harder", "not my problem", "touch grass", "ratio", "L + ratio"
- Classic memes: "this is fine dog", "crying cat", "panik kalm", "disaster girl", "distracted boyfriend", "drake pointing", "two buttons", "galaxy brain", "wait it's all", "always has been"
- Dev culture: "works on my machine", "git push force", "stackoverflow copy paste", "senior dev junior dev", "it's not a bug feature"
- Emotions: "brain dead", "crying laughing", "mind blown", "facepalm", "npc", "slay", "delulu"

Return ONLY the search query. No punctuation. No explanation.`,
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
