import {
  doublePrecision,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { itineraryItemsTable } from "./itinerary_items";

export const alternatesTable = pgTable("alternates", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => itineraryItemsTable.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),

  /** Same shape as itinerary_items.data for the parent's kind. */
  data: jsonb("data").notNull(),

  /** Tags like CHEAPER, EARLIER, SAME_AIRLINE */
  tags: text("tags").array().notNull().default([]),

  deltaCost: numeric("delta_cost", { precision: 10, scale: 2 }),
  deltaMinutes: integer("delta_minutes"),
  score: doublePrecision("score"),
});

export type Alternate = typeof alternatesTable.$inferSelect;
export type InsertAlternate = typeof alternatesTable.$inferInsert;
