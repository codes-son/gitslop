import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const processedWebhooksTable = pgTable("processed_webhooks", {
  deliveryId: text("delivery_id").primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ProcessedWebhook =
  typeof processedWebhooksTable.$inferSelect;
