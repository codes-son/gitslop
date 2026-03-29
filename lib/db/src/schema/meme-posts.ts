import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const memePostsTable = pgTable("meme_posts", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  gifUrl: text("gif_url").notNull(),
  githubUrl: text("github_url").notNull(),
  owner: text("owner").notNull(),
  repo: text("repo").notNull(),
  issueNumber: integer("issue_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MemePost = typeof memePostsTable.$inferSelect;
