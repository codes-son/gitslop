interface MemeConceptJson {
  body: string;
  gender: "girl" | "man" | "neutral";
  activity: string;
  background: string;
  memeText: string;
}

const FALLBACK_BODIES = [
  "golden retriever", "cat", "frog", "raccoon", "capybara", "penguin",
  "broccoli", "carrot", "strawberry", "banana", "cactus", "pineapple",
];

function fallbackConcept(keyword: string): MemeConceptJson {
  const body = FALLBACK_BODIES[Math.floor(Math.random() * FALLBACK_BODIES.length)];
  const gender = detectGender(keyword);
  return {
    body,
    gender,
    activity: `frantically dealing with "${keyword.slice(0, 40)}"`,
    background: "exploding server room with rainbow confetti",
    memeText: keyword.slice(0, 25).toUpperCase(),
  };
}

function detectGender(text: string): "girl" | "man" | "neutral" {
  const lower = text.toLowerCase();
  if (/\b(girl|woman|female|cewek|wanita|perempuan)\b/.test(lower)) return "girl";
  if (/\b(man|boy|male|cowok|pria|laki)\b/.test(lower)) return "man";
  return "neutral";
}

function composeDallePrompt(c: MemeConceptJson): string {
  const body       = c.body.slice(0, 20);
  const activity   = c.activity.slice(0, 80);
  const background = c.background.slice(0, 80);
  const memeText   = c.memeText.slice(0, 28).toUpperCase();

  const hairDesc =
    c.gender === "girl"    ? "long flowing hair, feminine features," :
    c.gender === "man"     ? "short hair, masculine features," :
    /* neutral */            "";

  return [
    `3D Pixar-style cartoon meme: expressive human face ${hairDesc} on ${body} humanoid body, ${activity}.`,
    `Background: ${background}.`,
    `Large bold white bubble letters at the top read "${memeText}".`,
    `Small text "github.com/apps/gitslopbot" bottom-right corner.`,
    `Vivid saturated colors, cinematic studio lighting, ultra detailed, square format.`,
  ].join(" ");
}

async function generateMemeConcept(keyword: string): Promise<MemeConceptJson> {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey  = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseURL || !apiKey) return fallbackConcept(keyword);

  const detectedGender = detectGender(keyword);

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
        max_tokens: 220,
        system: `You create image concepts for 3D Pixar cartoon memes. Return ONLY valid JSON, no other text.

Schema (strict char limits):
{
  "body": "<animal OR plant/vegetable/fruit/tree species, max 20 chars>",
  "gender": "<"girl" | "man" | "neutral" — infer from user text>",
  "activity": "<what the character is doing related to context, max 80 chars>",
  "background": "<wild chaotic colorful brainrot scene, max 80 chars>",
  "memeText": "<short punchy ALL-CAPS caption, max 28 chars>"
}

Rules:
- body: pick a funny/unique body — can be an animal (cat, frog, raccoon, capybara, penguin) OR a plant/vegetable/fruit/tree (broccoli, carrot, strawberry, banana, cactus, pineapple, oak tree, chili pepper). Mix it up, avoid repetition.
- gender: if user mentions girl/woman/cewek/wanita → "girl"; man/boy/cowok/pria → "man"; otherwise "neutral"
- activity: humanoid pose, action matches user context
- background: chaotic, colorful, absurd — space disco, offices exploding, rainbow chaos, underwater rave, etc
- memeText: 2–5 words, punchy internet meme energy
- Output ONLY the JSON object, nothing else`,
        messages: [{ role: "user", content: keyword }],
      }),
    });

    if (!res.ok) return fallbackConcept(keyword);

    const data = await res.json() as { content?: { type: string; text: string }[] };
    const raw  = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackConcept(keyword);

    const parsed = JSON.parse(jsonMatch[0]) as Partial<MemeConceptJson>;
    if (!parsed.body || !parsed.activity || !parsed.background || !parsed.memeText) {
      return fallbackConcept(keyword);
    }

    const rawGender = String(parsed.gender ?? "").toLowerCase();
    const gender: MemeConceptJson["gender"] =
      rawGender === "girl" ? "girl" :
      rawGender === "man"  ? "man"  :
      detectedGender;  // fall back to our own detection

    return {
      body:       String(parsed.body).slice(0, 20),
      gender,
      activity:   String(parsed.activity).slice(0, 80),
      background: String(parsed.background).slice(0, 80),
      memeText:   String(parsed.memeText).slice(0, 28),
    };
  } catch {
    return fallbackConcept(keyword);
  }
}

export async function generateMemeImage(keyword: string): Promise<{ imageBase64: string; imagePrompt: string }> {
  const concept     = await generateMemeConcept(keyword);
  const imagePrompt = composeDallePrompt(concept);

  const safePrompt = imagePrompt.slice(0, 3900);

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) throw new Error("OpenAI integration not configured");

  const res = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: safePrompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI image generation failed: ${res.status} ${err}`);
  }

  const result = await res.json() as { data: { b64_json: string }[] };
  const b64    = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");

  return {
    imageBase64: `data:image/png;base64,${b64}`,
    imagePrompt: `${concept.memeText} — ${concept.gender !== "neutral" ? concept.gender + " " : ""}${concept.body} ${concept.activity}`,
  };
}
