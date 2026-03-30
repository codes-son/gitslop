import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
} as ConstructorParameters<typeof Storage>[0]);

function getPublicApiBase(): string {
  // Prefer explicit env var (set this in production to the .replit.app domain)
  if (process.env.PUBLIC_API_BASE_URL) return process.env.PUBLIC_API_BASE_URL.replace(/\/$/, "");
  // Fall back to Replit dev domain
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:8080";
}

/**
 * Upload a base64 PNG image to GCS (private bucket) and return
 * a publicly-serveable URL via our own /api/meme-images/:id route.
 */
export async function uploadMemeImage(imageBase64: string): Promise<string> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");

  const b64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(b64, "base64");

  const id = randomUUID();
  const filename = `memes/${id}.png`;
  const bucket = storageClient.bucket(bucketId);
  const file = bucket.file(filename);

  // Store privately — served through our Express route
  await file.save(buffer, {
    contentType: "image/png",
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  const base = getPublicApiBase();
  return `${base}/api/meme-images/${id}`;
}

/**
 * Download a stored meme image from GCS by its UUID.
 * Returns the raw PNG buffer.
 */
export async function getMemeImageBuffer(id: string): Promise<Buffer> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");

  const filename = `memes/${id}.png`;
  const bucket = storageClient.bucket(bucketId);
  const file = bucket.file(filename);

  const [buffer] = await file.download();
  return buffer;
}
