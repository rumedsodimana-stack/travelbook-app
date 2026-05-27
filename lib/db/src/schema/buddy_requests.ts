import {
  doublePrecision,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { passesTable } from "./passes";
import { usersTable } from "./users";

export const buddyRequestStateEnum = pgEnum("buddy_request_state", [
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const buddyRequestsTable = pgTable("buddy_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  passId: uuid("pass_id")
    .notNull()
    .references(() => passesTable.id, { onDelete: "cascade" }),
  requesterId: uuid("requester_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  state: buddyRequestStateEnum("state").notNull().default("pending"),
  message: text("message").notNull().default(""),
  fitScore: doublePrecision("fit_score").notNull().default(0),

  /** {pace: 'match', budget: 'match', diet: 'match', mornings: 'soft'} */
  fitBreakdown: jsonb("fit_breakdown").notNull().default({}),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export const BuddyRequestStateSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "expired",
]);

export const createBuddyRequestSchema = z.object({
  passId: z.string().uuid(),
  message: z.string().max(280).default(""),
});

export const decideBuddyRequestSchema = z.object({
  decision: z.enum(["accepted", "declined"]),
});

export type BuddyRequest = typeof buddyRequestsTable.$inferSelect;
export type InsertBuddyRequest = typeof buddyRequestsTable.$inferInsert;
export type CreateBuddyRequest = z.infer<typeof createBuddyRequestSchema>;
