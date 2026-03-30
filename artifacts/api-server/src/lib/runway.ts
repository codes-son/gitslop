const RUNWAY_API_BASE    = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_VERSION = "2024-11-06";
const POLL_INTERVAL_MS   = 5000;
const MAX_POLL_ATTEMPTS  = 36; // 3 minutes max

// Runway promptText hard limit: 512 chars
const RUNWAY_PROMPT_LIMIT = 512;
const RUNWAY_MOTION_SUFFIX = " — character bouncing and gesturing wildly, exaggerated arm flailing, head bopping, expressive face reacting. Camera slowly dollies in with slight wobble, then pulls back. Background elements spinning and pulsing. Smooth Pixar 3D animation, 24fps.";
// suffix is 249 chars, leaving 263 chars for the keyword context

interface RunwayTaskResponse {
  id: string;
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  output?: string[];
  failure?: string;
  failureCode?: string;
}

function buildMotionPrompt(keyword: string): string {
  const maxKeywordLen = RUNWAY_PROMPT_LIMIT - RUNWAY_MOTION_SUFFIX.length;
  const kw = keyword.slice(0, maxKeywordLen);
  return `${kw}${RUNWAY_MOTION_SUFFIX}`.slice(0, RUNWAY_PROMPT_LIMIT);
}

async function submitRunwayTask(imageDataUri: string, keyword: string): Promise<string> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new Error("RUNWAY_API_KEY not set");

  const promptText = buildMotionPrompt(keyword);

  const res = await fetch(`${RUNWAY_API_BASE}/image_to_video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": RUNWAY_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      promptImage: imageDataUri,
      promptText,
      model: "gen3a_turbo",
      duration: 5,
      ratio: "1280:768",
      seed: Math.floor(Math.random() * 1_000_000),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Runway submission failed: ${res.status} ${err}`);
  }

  const data = await res.json() as RunwayTaskResponse;
  if (!data.id) throw new Error("No task ID returned from Runway");
  return data.id;
}

async function pollRunwayTask(taskId: string): Promise<string> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) throw new Error("RUNWAY_API_KEY not set");

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const res = await fetch(`${RUNWAY_API_BASE}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Runway-Version": RUNWAY_API_VERSION,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Runway poll failed: ${res.status} ${err}`);
    }

    const task = await res.json() as RunwayTaskResponse;

    if (task.status === "SUCCEEDED") {
      const videoUrl = task.output?.[0];
      if (!videoUrl) throw new Error("Runway succeeded but returned no output URL");
      return videoUrl;
    }

    if (task.status === "FAILED" || task.status === "CANCELLED") {
      throw new Error(`Runway task ${task.status}: ${task.failure ?? task.failureCode ?? "unknown"}`);
    }
  }

  throw new Error("Runway task timed out after 3 minutes");
}

export async function animateImage(imageDataUri: string, keyword: string): Promise<string> {
  const taskId = await submitRunwayTask(imageDataUri, keyword);
  return pollRunwayTask(taskId);
}
