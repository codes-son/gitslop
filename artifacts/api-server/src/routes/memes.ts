import { Router, type IRouter } from "express";
import { db, memePostsTable } from "@workspace/db";
import { desc, notInArray } from "drizzle-orm";
import { ListMemesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/memes", async (req, res) => {
  const rawLimit = Number(req.query.limit ?? 50);
  const rawOffset = Number(req.query.offset ?? 0);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 50;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const BLOCKED_OWNERS = ["buildish-arc"];
  const ownerFilter = notInArray(memePostsTable.owner, BLOCKED_OWNERS);

  const [memes, countResult] = await Promise.all([
    db
      .select()
      .from(memePostsTable)
      .where(ownerFilter)
      .orderBy(desc(memePostsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.$count(memePostsTable, ownerFilter),
  ]);

  const data = ListMemesResponse.parse({
    memes: memes.map((m) => ({
      id: m.id,
      keyword: m.keyword,
      videoUrl: m.videoUrl,
      imageUrl: m.imageUrl ?? undefined,
      imagePrompt: m.imagePrompt ?? undefined,
      githubUrl: m.githubUrl,
      owner: m.owner,
      repo: m.repo,
      issueNumber: m.issueNumber,
      createdAt: m.createdAt.toISOString(),
    })),
    total: Number(countResult),
  });

  res.json(data);
});

export default router;
