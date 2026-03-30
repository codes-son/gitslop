interface MemeConceptJson {
  animal: string;
  activity: string;
  background: string;
  memeText: string;
}

const FALLBACK_ANIMALS = ["golden retriever", "cat", "frog", "raccoon", "capybara", "penguin", "hamster"];

function fallbackConcept(keyword: string): MemeConceptJson {
  const animal = FALLBACK_ANIMALS[Math.floor(Math.random() * FALLBACK_ANIMALS.length)];
  return {
    animal,
    activity: `frantically dealing with "${keyword.slice(0, 40)}"`,
    background: "exploding server room with rainbow confetti",
    memeText: keyword.slice(0, 25).toUpperCase(),
  };
}

function composeDallePrompt(c: MemeConceptJson): string {
  // Budget: animal ≤20, activity ≤80, background ≤80, memeText ≤28
  // Total target: ~420 chars, well under DALL-E 3 limit of 4000
  const animal     = c.animal.slice(0, 20);
  const activity   = c.activity.slice(0, 80);
  const background = c.background.slice(0, 80);
  const memeText   = c.memeText.slice(0, 28).toUpperCase();

  return [
    `3D Pixar-style cartoon meme: expressive human face on ${animal} humanoid body, ${activity}.`,
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
        max_tokens: 200,
        system: `You create DALL-E image concepts for 3D cartoon memes. Return ONLY valid JSON, no other text.

Schema (strict char limits to keep DALL-E prompt short):
{
  "animal": "<animal species, max 20 chars>",
  "activity": "<what the character is doing related to user context, max 80 chars>",
  "background": "<wild fun brainrot/slop scene, max 80 chars>",
  "memeText": "<short punchy ALL-CAPS caption, max 28 chars>"
}

Rules:
- animal: pick a funny/random animal that fits the vibe
- activity: humanoid pose, action matches user's context
- background: chaotic, colorful, absurd — offices exploding, space disco, rainbow chaos, etc
- memeText: 2-5 words max, punchy internet meme energy
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
    if (!parsed.animal || !parsed.activity || !parsed.background || !parsed.memeText) {
      return fallbackConcept(keyword);
    }

    return {
      animal:     String(parsed.animal).slice(0, 20),
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

  // Safety check: DALL-E 3 hard limit is 4000 chars
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
    imagePrompt: `${concept.memeText} — ${concept.animal} ${concept.activity}`,
  };
}
