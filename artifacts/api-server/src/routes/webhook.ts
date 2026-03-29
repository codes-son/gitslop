import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { searchGiphy } from "../lib/giphy.js";
import { getInstallationToken, postIssueComment, postDiscussionComment } from "../lib/github.js";
import { db, processedWebhooksTable, memePostsTable } from "@workspace/db";

const router: IRouter = Router();

function verifySignature(
  secret: string,
  rawBody: Buffer,
  signature: string,
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signature, "utf8"),
    );
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

router.post(
  "/webhook/github",
  async (req: Request, res: Response): Promise<void> => {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const giphyApiKey = process.env.GIPHY_API_KEY;
    const appId = process.env.GITHUB_APP_ID;
    const rawPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!webhookSecret || !giphyApiKey || !appId || !rawPrivateKey) {
      req.log.error(
        {
          hasSecret: !!webhookSecret,
          hasGiphy: !!giphyApiKey,
          hasAppId: !!appId,
          hasPrivateKey: !!rawPrivateKey,
        },
        "Missing required environment variables",
      );
      res.status(500).json({ error: "Server configuration error" });
      return;
    }

    let privateKey = rawPrivateKey.replace(/\\n/g, "\n");
    if (!privateKey.includes("\n")) {
      const header = "-----BEGIN RSA PRIVATE KEY-----";
      const footer = "-----END RSA PRIVATE KEY-----";
      const body = privateKey.replace(header, "").replace(footer, "").trim();
      const lines = body.match(/.{1,64}/g) ?? [];
      privateKey = `${header}\n${lines.join("\n")}\n${footer}`;
    }

    const signature = req.headers["x-hub-signature-256"] as string | undefined;
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!signature || !rawBody) {
      req.log.warn("Webhook request missing signature or raw body");
      res.status(400).json({ error: "Missing signature or body" });
      return;
    }

    if (!verifySignature(webhookSecret, rawBody, signature)) {
      req.log.warn("Invalid webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const deliveryId = req.headers["x-github-delivery"] as string | undefined;
    const event = req.headers["x-github-event"] as string | undefined;

    const isDiscussion = event === "discussion_comment";
    if (
      event !== "issue_comment" &&
      event !== "pull_request_review_comment" &&
      !isDiscussion
    ) {
      res.json({ ok: true, skipped: "unhandled event" });
      return;
    }

    const payload = req.body as Record<string, unknown>;

    if (payload.action !== "created") {
      res.json({ ok: true, skipped: "not a create action" });
      return;
    }

    const sender = payload.sender as Record<string, unknown> | undefined;
    const senderType = sender?.type as string | undefined;
    if (senderType === "Bot") {
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
        req.log.info({ deliveryId }, "Duplicate delivery — skipping");
        res.json({ ok: true, skipped: "duplicate delivery" });
        return;
      }
    }

    const installation = payload.installation as
      | Record<string, unknown>
      | undefined;
    const installationId = installation?.id as number | undefined;

    if (!installationId) {
      req.log.error({ payload }, "Missing installation ID in payload");
      res.status(400).json({ error: "Missing installation info" });
      return;
    }

    const repository = payload.repository as
      | Record<string, unknown>
      | undefined;
    const owner = (
      (repository?.owner as Record<string, unknown> | undefined)?.login as
        | string
        | undefined
    );
    const repo = repository?.name as string | undefined;

    const issue = payload.issue as Record<string, unknown> | undefined;
    const pullRequest = payload.pull_request as
      | Record<string, unknown>
      | undefined;
    const discussion = payload.discussion as
      | Record<string, unknown>
      | undefined;
    const discussionNodeId = discussion?.node_id as string | undefined;
    const issueNumber =
      (issue?.number as number | undefined) ??
      (pullRequest?.number as number | undefined) ??
      (discussion?.number as number | undefined);

    if (!owner || !repo || !issueNumber) {
      req.log.error({ owner, repo, issueNumber }, "Missing repository info");
      res.status(400).json({ error: "Missing repository info in payload" });
      return;
    }

    req.log.info({ owner, repo, issueNumber, keyword }, "GitSlop triggered");

    let installationToken: string;
    try {
      installationToken = await getInstallationToken(
        appId,
        privateKey,
        installationId,
      );
    } catch (err) {
      req.log.error({ err }, "Failed to get GitHub App installation token");
      res.status(500).json({ error: "GitHub App auth failed" });
      return;
    }

    let gifUrl: string | null = null;
    try {
      gifUrl = await searchGiphy(keyword, giphyApiKey);
    } catch (err) {
      req.log.error({ err, keyword }, "Failed to fetch meme from Giphy");
    }

    const replyBody = gifUrl
      ? `![${keyword}](${gifUrl})\n\n> *gitslop for: \`${keyword}\`*`
      : `> *gitslop couldn't find a meme for: \`${keyword}\` — the internet has let us down.*`;

    try {
      if (isDiscussion) {
        if (!discussionNodeId) {
          req.log.error("Missing discussion node_id in payload");
          res.status(400).json({ error: "Missing discussion node_id" });
          return;
        }
        await postDiscussionComment(
          installationToken,
          discussionNodeId,
          replyBody,
        );
      } else {
        await postIssueComment(
          installationToken,
          owner,
          repo,
          issueNumber,
          replyBody,
        );
      }
      req.log.info(
        { owner, repo, issueNumber, keyword, hasMeme: !!gifUrl, isDiscussion },
        "Posted meme reply",
      );
    } catch (err) {
      req.log.error({ err }, "Failed to post GitHub comment");
      res.status(500).json({ error: "Failed to post comment" });
      return;
    }

    if (gifUrl) {
      const githubUrl =
        commentHtmlUrl ||
        `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
      try {
        await db.insert(memePostsTable).values({
          keyword,
          gifUrl,
          githubUrl,
          owner,
          repo,
          issueNumber,
        });
      } catch (err) {
        req.log.warn({ err }, "Failed to save meme post to DB");
      }
    }

    res.json({ ok: true, keyword, hasMeme: !!gifUrl });
  },
);

export default router;
