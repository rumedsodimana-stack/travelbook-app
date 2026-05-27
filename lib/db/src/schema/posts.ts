import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { passesTable } from "./passes";
import { usersTable } from "./users";

export const postKindEnum = pgEnum("post_kind", [
  "photo",
  "pass_share",
  "story",
  "provider_offer",
  "memory_book", // v2
]);
export const postVisibilityEnum = pgEnum("post_visibility", [
  "public",
  "friends",
  "link",
]);

export const postsTable = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  kind: postKindEnum("kind").notNull(),
  caption: text("caption").notNull().default(""),
  photoUrls: text("photo_urls").array().notNull().default([]),
  passId: uuid("pass_id").references(() => passesTable.id, {
    onDelete: "set null",
  }),
  visibility: postVisibilityEnum("visibility").notNull().default("friends"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  likesCount: integer("likes_count").notNull().default(0),
  repostsCount: integer("reposts_count").notNull().default(0),
});

export const PostKindSchema = z.enum([
  "photo",
  "pass_share",
  "story",
  "provider_offer",
  "memory_book",
]);
export const PostVisibilitySchema = z.enum(["public", "friends", "link"]);

export const createPostSchema = z.object({
  kind: PostKindSchema,
  caption: z.string().max(280).default(""),
  photoUrls: z.array(z.string().url()).default([]),
  passId: z.string().uuid().nullable().optional(),
  visibility: PostVisibilitySchema.default("friends"),
});

export type Post = typeof postsTable.$inferSelect;
export type InsertPost = typeof postsTable.$inferInsert;
export type CreatePost = z.infer<typeof createPostSchema>;
