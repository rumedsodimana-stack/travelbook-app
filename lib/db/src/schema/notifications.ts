import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { usersTable } from "./users";

export const notificationKindEnum = pgEnum("notification_kind", [
  "time_nudge",
  "reshuffle",
  "buddy_request",
  "buddy_joined",
  "visa_approved",
  "flight_delay",
  "provider_offer",
  "trip_ending",
  "book_minted",
]);

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  kind: notificationKindEnum("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  deepLink: text("deep_link"),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const NotificationKindSchema = z.enum([
  "time_nudge",
  "reshuffle",
  "buddy_request",
  "buddy_joined",
  "visa_approved",
  "flight_delay",
  "provider_offer",
  "trip_ending",
  "book_minted",
]);

export type Notification = typeof notificationsTable.$inferSelect;
export type InsertNotification = typeof notificationsTable.$inferInsert;
