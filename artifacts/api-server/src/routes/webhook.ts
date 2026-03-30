import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { generateMemeImage } from "../lib/image-gen.js";
import { animateImage } from "../lib/runway.js";
import { uploadMemeImage } from "../lib/image-upload.js";
import {
  getInstallationToken,
  postIssueCommentAndGetId,
  updateIssueComment,
  postDiscussionCommentAndGetId,
  updateDiscussionComment,
} from "../lib/github.js";
import { db, processedWebhooksTable, memePostsTable } from "@workspace/db";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

function verifySignature(secret: string, rawBody: Buffer, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

function extractKeyword(body: string): string | null {
  const match = body.match(/@gitslopbot\s+(.+?)(?:\r?\n|$)/i);
  if (!match) return null;
  const keyword = match[1].trim();
  return keyword.length > 0 ? keyword : null;
}

function normalizePrivateKey(raw: string): string {
  let key = raw.replace(/\\n/g, "\n");
  if (!key.includes("\n")) {
    const header = "-----BEGIN RSA PRIVATE KEY-----";
    const footer = "-----END RSA PRIVATE KEY-----";
    const body = key.replace(header, "").replace(footer, "").trim();
    const lines = body.match(/.{1,64}/g) ?? [];
    key = `${header}\n${lines.join("\n")}\n${footer}`;
  }
  return key;
}

/** Step 1 comment body — image is ready, video is cooking */
function buildImageReadyComment(imageUrl: string, keyword: string, imagePrompt: string): string {
  return [
    `🔥 **yo, ur brainrot meme just got cooked up no cap**`,
    ``,
    `![meme](${imageUrl})`,
    ``,
    `> *"${keyword}"*`,
    `> 🎨 *Prompt: ${imagePrompt}*`,
    ``,
    `---`,
    `⏳ **Runway is animating this bad boy rn... gimme like a minute fr fr** 🎬`,
    `*(I'll update this comment with the video when it's done slapping)*`,
  ].join("\n");
}

/** Step 2 comment body — video is ready, update the same comment */
function buildVideoReadyComment(imageUrl: string, videoUrl: string, keyword: string, imagePrompt: string): string {
  return [
    `🎬 **no cap this video just dropped and it goes HARD 💀🔥**`,
    ``,
    `**[▶ WATCH THIS SLOP RIGHT NOW](${videoUrl})**`,
    ``,
    `![still](${imageUrl})`,
    ``,
    `> *"${keyword}"*`,
    `> 🎨 *Prompt: ${imagePrompt}*`,
    ``,
    `---`,
    `*Cooked by [@gitslopbot](https://github.com/apps/gitslopbot) • not my fault ur eyes can't unsee this*`,
  ].join("\n");
}

/** Failure comment */
function buildFailureComment(keyword: string): string {
  return [
    `💀 **the AI said nah fam, couldn't cook this one**`,
    ``,
    `> *Attempted for: \`${keyword}\`*`,
    ``,
    `*touch grass and try again later lowkey*`,
  ].join("\n");
}

async function processMemeInBackground(opts: {
  keyword: string;
  owner: string;
  repo: string;
  issueNumber: number;
  isDiscussion: boolean;
  discussionNodeId?: string;
  githubUrl: string;
  privateKey: string;
  appId: string;
  installationId: number;
}): Promise<void> {
  const { keyword, owner, repo, issueNumber, isDiscussion, discussionNodeId, githubUrl, privateKey, appId, installationId } = opts;

  // ── Step 1: Generate image ────────────────────────────────────────────────
  let imageBase64: string;
  let imagePrompt: string;
  let imageUrl: string;

  try {
    logger.info({ keyword }, "Step 1: Generating meme image");
    const result = await generateMemeImage(keyword);
    imageBase64 = result.imageBase64;
    imagePrompt = result.imagePrompt;
  } catch (err) {
    logger.error({ err, keyword }, "Image generation failed");
    // Post failure comment and bail
    try {
      const token = await getInstallationToken(appId, privateKey, installationId);
      const body = buildFailureComment(keyword);
      if (isDiscussion && discussionNodeId) {
        await postDiscussionCommentAndGetId(token, discussionNodeId, body);
      } else {
        await postIssueCommentAndGetId(token, owner, repo, issueNumber, body);
      }
    } catch (postErr) {
      logger.error({ postErr }, "Failed to post failure comment");
    }
    return;
  }

  // ── Step 2: Upload image to GCS ───────────────────────────────────────────
  try {
    logger.info({ keyword }, "Step 2: Uploading image to storage");
    imageUrl = await uploadMemeImage(imageBase64);
    logger.info({ keyword, imageUrl }, "Image uploaded");
  } catch (err) {
    logger.error({ err, keyword }, "Image upload failed — using base64 fallback URL");
    // Fall back to data URI embedded in comment (GitHub might strip it, but try)
    imageUrl = imageBase64.slice(0, 200); // GitHub will likely reject this, video comment will still work
  }

  // ── Step 3: Post first GitHub comment (image + "cooking video") ───────────
  let commentRef: { type: "issue"; id: number } | { type: "discussion"; nodeId: string } | null = null;

  try {
    const installationToken = await getInstallationToken(appId, privateKey, installationId);
    const step1Body = buildImageReadyComment(imageUrl, keyword, imagePrompt);
    if (isDiscussion && discussionNodeId) {
      const nodeId = await postDiscussionCommentAndGetId(installationToken, discussionNodeId, step1Body);
      commentRef = { type: "discussion", nodeId };
    } else {
      const id = await postIssueCommentAndGetId(installationToken, owner, repo, issueNumber, step1Body);
      commentRef = { type: "issue", id };
    }
    logger.info({ keyword, commentRef }, "Step 3: Posted image comment");
  } catch (err) {
    logger.error({ err }, "Failed to post image comment — continuing to Runway anyway");
  }

  // ── Step 4: Animate with Runway ───────────────────────────────────────────
  let videoUrl: string | null = null;
  try {
    logger.info({ keyword }, "Step 4: Animating with Runway");
    videoUrl = await animateImage(imageBase64, keyword);
    logger.info({ keyword, videoUrl }, "Runway video generated");
  } catch (err) {
    logger.error({ err, keyword }, "Runway animation failed");
  }

  // ── Step 5: Update comment with video (or post new one if we didn't get ref) ─
  let freshToken: string;
  try {
    freshToken = await getInstallationToken(appId, privateKey, installationId);
  } catch (err) {
    logger.error({ err }, "Step 5: Failed to get installation token for final comment");
    // Still save to DB even if we can't post
    if (videoUrl) {
      try {
        await db.insert(memePostsTable).values({ keyword, videoUrl, imagePrompt, githubUrl, owner, repo, issueNumber });
      } catch (dbErr) { logger.warn({ dbErr }, "Failed to save meme to DB"); }
    }
    return;
  }

  try {
    const finalBody = videoUrl
      ? buildVideoReadyComment(imageUrl, videoUrl, keyword, imagePrompt)
      : buildFailureComment(keyword);

    if (commentRef) {
      // Update the existing comment in-place
      if (commentRef.type === "issue") {
        await updateIssueComment(freshToken, owner, repo, commentRef.id, finalBody);
      } else {
        await updateDiscussionComment(freshToken, commentRef.nodeId, finalBody);
      }
      logger.info({ keyword, hasVideo: !!videoUrl }, "Step 5: Updated comment with video");
    } else {
      // Fallback: post a new comment if step 3 failed
      if (isDiscussion && discussionNodeId) {
        await postDiscussionCommentAndGetId(freshToken, discussionNodeId, finalBody);
      } else {
        await postIssueCommentAndGetId(freshToken, owner, repo, issueNumber, finalBody);
      }
      logger.info({ keyword, hasVideo: !!videoUrl }, "Step 5: Posted new comment (fallback)");
    }
  } catch (err) {
    logger.error({ err }, "Failed to update/post final GitHub comment");
  }

  // ── Step 6: Save to DB ────────────────────────────────────────────────────
  if (videoUrl) {
    try {
      await db.insert(memePostsTable).values({
        keyword,
        videoUrl,
        imagePrompt,
        githubUrl,
        owner,
        repo,
        issueNumber,
      });
      logger.info({ keyword }, "Saved meme to DB");
    } catch (err) {
      logger.warn({ err }, "Failed to save meme post to DB");
    }
  }
}

router.post(
  "/webhook/github",
  async (req: Request, res: Response): Promise<void> => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const appId = process.env.GITHUB_APP_ID;
    const rawPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!webhookSecret || !appId || !rawPrivateKey) {
      req.log.error("Missing required environment variables");
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    const privateKey = normalizePrivateKey(rawPrivateKey);
    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!signature || !rawBody) {
      res.status(400).json({ error: "Missing signature or body" });
      return;
    }

    if (!verifySignature(webhookSecret, rawBody, signature)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const deliveryId = req.headers["x-github-delivery"] as string | undefined;
    const event = req.headers["x-github-event"] as string | undefined;

    const isDiscussion = event === "discussion_comment";
    if (event !== "issue_comment" && event !== "pull_request_review_comment" && !isDiscussion) {
      res.json({ ok: true, skipped: "unhandled event" });
      return;
    }

    const payload = req.body as Record<string, unknown>;
    if (payload.action !== "created") {
      res.json({ ok: true, skipped: "not a create action" });
      return;
    }

    const sender = payload.sender as Record<string, unknown> | undefined;
    if ((sender?.type as string) === "Bot") {
      res.json({ ok: true, skipped: "bot loop prevention" });
      return;
    }

    const comment = payload.comment as Record<string, unknown> | undefined;
    const commentBody = (comment?.body as string) ?? "";
    const commentHtmlUrl = (comment?.html_url as string | undefined) ?? "";

    if (!commentBody.toLowerCase().includes("@gitslopbot")) {
      res.json({ ok: true, skipped: "no mention" });
      return;
    }

    const keyword = extractKeyword(commentBody);
    if (!keyword) {
      res.json({ ok: true, skipped: "no keyword after mention" });
      return;
    }

    if (deliveryId) {
      const inserted = await db
        .insert(processedWebhooksTable)
        .values({ deliveryId })
        .onConflictDoNothing()
        .returning({ id: processedWebhooksTable.deliveryId });
      if (inserted.length === 0) {
        res.json({ ok: true, skipped: "duplicate delivery" });
        return;
      }
    }

    const installation = payload.installation as Record<string, unknown> | undefined;
    const installationId = installation?.id as number | undefined;
    if (!installationId) {
      res.status(400).json({ error: "Missing installation info" });
      return;
    }

    const repository = payload.repository as Record<string, unknown> | undefined;
    const owner = ((repository?.owner as Record<string, unknown> | undefined)?.login as string | undefined) ?? "";
    const repo = (repository?.name as string | undefined) ?? "";
    const issue = payload.issue as Record<string, unknown> | undefined;
    const pullRequest = payload.pull_request as Record<string, unknown> | undefined;
    const discussion = payload.discussion as Record<string, unknown> | undefined;
    const discussionNodeId = discussion?.node_id as string | undefined;
    const issueNumber =
      (issue?.number as number | undefined) ??
      (pullRequest?.number as number | undefined) ??
      (discussion?.number as number | undefined) ?? 0;

    if (!owner || !repo || !issueNumber) {
      res.status(400).json({ error: "Missing repository info in payload" });
      return;
    }

    req.log.info({ owner, repo, issueNumber, keyword }, "GitSlop triggered — async AI pipeline starting");

    const githubUrl = commentHtmlUrl || `https://github.com/${owner}/${repo}/issues/${issueNumber}`;

    setImmediate(() => {
      processMemeInBackground({
        keyword,
        owner,
        repo,
        issueNumber,
        isDiscussion,
        discussionNodeId,
        githubUrl,
        privateKey,
        appId,
        installationId,
      }).catch((err) => logger.error({ err }, "Unhandled error in background meme processing"));
    });

    res.json({ ok: true, keyword, processing: true });
  },
);

export default router;
