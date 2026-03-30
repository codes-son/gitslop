import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Check and rename gif_url → video_url
    const { rows: gifUrlCheck } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'meme_posts' AND column_name = 'gif_url'
    `);
    if (gifUrlCheck.length > 0) {
      await client.query(`ALTER TABLE meme_posts RENAME COLUMN gif_url TO video_url`);
      logger.info("Migration: renamed gif_url → video_url");
    }

    // Check and add image_prompt column
    const { rows: imagePromptCheck } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'meme_posts' AND column_name = 'image_prompt'
    `);
    if (imagePromptCheck.length === 0) {
      await client.query(`ALTER TABLE meme_posts ADD COLUMN image_prompt TEXT`);
      logger.info("Migration: added image_prompt column");
    }
  } catch (err) {
    logger.error({ err }, "Startup migration failed");
    throw err;
  } finally {
    client.release();
  }
}
