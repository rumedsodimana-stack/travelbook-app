import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { usersTable } from "./users";

export const passStateEnum = pgEnum("pass_state", [
  "draft",
  "live",
  "upcoming",
  "archived",
]);
export const passVisibilityEnum = pgEnum("pass_visibility", [
  "private",
  "link",
  "friends",
  "public",
]);

export const passesTable = pgTable("passes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  passNo: serial("pass_no").notNull(),
  code: text("code").notNull().unique(),

  title: text("title").notNull(),
  coverImageUrl: text("cover_image_url"),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),

  state: passStateEnum("state").notNull().default("draft"),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("USD"),

  aiPrompt: text("ai_prompt"),
  aiBuiltAt: timestamp("ai_built_at", { withTimezone: true }),

  visibility: passVisibilityEnum("visibility").notNull().default("private"),
  openSeats: integer("open_seats").notNull().default(0),
  seatsClosesAt: timestamp("seats_closes_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const PassStateSchema = z.enum(["draft", "live", "upcoming", "archived"]);
export const PassVisibilitySchema = z.enum(["private", "link", "friends", "public"]);

export const passShareSchema = z.object({
  visibility: PassVisibilitySchema,
  openSeats: z.number().int().min(0).max(8).default(0),
  seatsClosesAt: z.string().nullable().optional(), // ISO timestamp
});

export type Pass = typeof passesTable.$inferSelect;
export type InsertPass = typeof passesTable.$inferInsert;
export type PassShare = z.infer<typeof passShareSchema>;
