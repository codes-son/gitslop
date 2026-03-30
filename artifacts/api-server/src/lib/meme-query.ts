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

const PROVEN_MEME_QUERIES = [
  // Dev / coding pain
  "this is fine fire dog",
  "works on my machine",
  "it is what it is shrug",
  "bugs everywhere toy story",
  "senior dev nodding",
  "stackoverflow copy paste",
  "git blame",
  "it's not a bug it's a feature",
  "deploy on friday",
  "production is down",
  // Emotions / reactions
  "crying cat",
  "screaming internally",
  "mind blown",
  "facepalm",
  "dramatically shocked",
  "npc frozen",
  "galaxy brain big brain",
  "brainrot spinning",
  "i have no idea what im doing dog",
  "confusion math lady",
  // Brainrot / gen z
  "skill issue",
  "cope seethe",
  "ratio",
  "not my problem",
  "delulu slay",
  "touch grass",
  "rizz",
  "no cap fr fr",
  "sigma grindset",
  "ohio only in ohio",
  // Chaos / failure
  "disaster girl smiling",
  "everything is on fire",
  "this is a disaster",
  "trainwreck",
  "watching the world burn",
  "laughing crying",
  "utter chaos",
  // Hype / success
  "lets go celebration",
  "ship it",
  "we did it reddit",
  "victory royale",
  "absolute cinema",
  "it actually works",
  "slay queen",
  // Sarcasm / passive aggressive
  "cool story bro",
  "wow very impressive sarcastic",
  "clapping slow clap",
  "sure jan",
  "bless your heart",
  "thoughts and prayers",
  // Confusion / what
  "what is this spongebob",
  "i dont understand",
  "huh what meme",
  "they dont know",
  "surprised pikachu",
  "wait what",
];

export async function generateMemeQuery(keyword: string): Promise<string> {
  const openai = getClient();
  if (!openai) return `${keyword} meme`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 40,
      messages: [
        {
          role: "system",
          content: `You are a meme sommelier. Your job: read ANY input (even gibberish, typos, or random words) and return the SINGLE best 2-5 word Giphy search query that will return a hilarious, viral, brainrot-tier reaction GIF.

Rules:
- Read the emotional VIBE and context, not just the literal words
- Prioritize specific, well-known meme formats over generic terms — they return better results
- Think like a chronically-online developer who lives on Twitter/Reddit
- Return ONLY the search query string, nothing else

Style guide (use as inspiration, not a locked list):
${PROVEN_MEME_QUERIES.slice(0, 20).join(", ")}
...and similar internet/dev culture references. Invent better ones if the context calls for it.`,
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
