import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const memePostsTable = pgTable("meme_posts", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  videoUrl: text("video_url").notNull(),
  imagePrompt: text("image_prompt"),
  githubUrl: text("github_url").notNull(),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  issueNumber: integer("issue_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MemePost = typeof memePostsTable.$inferSelect;
