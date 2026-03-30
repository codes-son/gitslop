const BRAINROT_STYLE = `hyper-chaotic internet brainrot meme, extremely funny and absurdist, neon colors, multiple chaotic elements, dank meme aesthetic, viral internet humor, ultra-detailed, maximalist composition, eye-catching, surreal comedy`;

async function generateImagePrompt(keyword: string): Promise<string> {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseURL || !apiKey) return `${keyword}, ${BRAINROT_STYLE}`;

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
        max_tokens: 120,
        system: `You are a creative AI that generates DALL-E image prompts for hyper-chaotic internet brainrot memes. Given any input, create a vivid, funny, absurdist image description that will result in a hilarious viral-worthy meme image.

Rules:
- Make it visually chaotic and funny
- Include specific visual details (characters, colors, expressions, scene)
- Reference popular internet/meme culture when relevant
- Keep it under 80 words
- Output ONLY the image description, no explanation
- Always end with: ${BRAINROT_STYLE}`,
        messages: [
          { role: "user", content: keyword },
        ],
      }),
    });

    if (!res.ok) return `${keyword}, ${BRAINROT_STYLE}`;

    const data = await res.json() as { content?: { type: string; text: string }[] };
    const text = data.content?.find((b) => b.type === "text")?.text?.trim();
    return text && text.length > 0 ? text : `${keyword}, ${BRAINROT_STYLE}`;
  } catch {
    return `${keyword}, ${BRAINROT_STYLE}`;
  }
}

export async function generateMemeImage(keyword: string): Promise<{ imageBase64: string; imagePrompt: string }> {
  const imagePrompt = await generateImagePrompt(keyword);

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

  if (!baseURL || !apiKey) {
    throw new Error("OpenAI integration not configured");
  }

  const res = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
      quality: "standard",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI image generation failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { data: { b64_json: string }[] };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");

  return {
    imageBase64: `data:image/png;base64,${b64}`,
    imagePrompt,
  };
}
