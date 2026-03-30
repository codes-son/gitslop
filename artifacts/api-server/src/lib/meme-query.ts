const PROVEN_MEME_QUERIES = [
  "this is fine fire dog",
  "works on my machine",
  "bugs everywhere toy story",
  "deploy on friday",
  "production is down",
  "crying cat",
  "mind blown",
  "facepalm",
  "galaxy brain",
  "i have no idea what im doing dog",
  "skill issue",
  "cope seethe",
  "surprised pikachu",
  "disaster girl smiling",
  "everything is on fire",
  "laughing crying",
  "lets go celebration",
  "absolute cinema",
  "cool story bro",
  "slow clap",
];

export async function generateMemeQuery(keyword: string): Promise<string> {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseURL || !apiKey) return `${keyword} meme`;

  try {
    const res = await fetch(`${baseURL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 50,
        system: `You are a Giphy search expert for developers. Read ANY input and return the SINGLE best 2-5 word Giphy search query that will find a hilarious, viral, ACTUALLY EXISTING popular GIF.

Rules:
- Pick queries that match REAL popular GIFs already on Giphy — not clever invented phrases
- If input has specific topics (Bitcoin, Elon, anime, React etc), use SIMPLE combinations like "anime bitcoin", "elon musk laugh" — short and direct beats creative
- Prefer broad well-known terms over niche creative ones (better Giphy coverage)
- Think: "what would I type into Giphy to find a funny GIF about this?"
- ALWAYS output in English regardless of input language
- Return ONLY the search query, no punctuation, no explanation

Good query examples (simple + direct): ${PROVEN_MEME_QUERIES.slice(0, 10).join(", ")}`,
        messages: [
          { role: "user", content: keyword },
        ],
      }),
    });

    if (!res.ok) return `${keyword} meme`;

    const data = await res.json() as { content?: { type: string; text: string }[] };
    const text = data.content?.find((b) => b.type === "text")?.text?.trim();
    return text && text.length > 0 ? text : `${keyword} meme`;
  } catch {
    return `${keyword} meme`;
  }
}
