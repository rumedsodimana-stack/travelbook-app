import {
  boolean,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

export const providerKindEnum = pgEnum("provider_kind", [
  "accommodation",
  "transport",
  "flight",
  "insurance",
  "visa",
  "event",
  "entertainment",
  "activity",
  "dining",
  "tour_package",
]);

export const providerSourceEnum = pgEnum("provider_source", [
  "native",
  "amadeus",
  "travelpayouts",
  "viator",
  "klook",
  "getyourguide",
  "ticketmaster",
  "opentable",
  "fluxir",
  "sherpa",
  "fixture",
]);

export const providersTable = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: providerKindEnum("kind").notNull(),
  name: text("name").notNull(),
  verified: boolean("verified").notNull().default(false),
  country: text("country"),
  listingUrl: text("listing_url"),
  managedBy: uuid("managed_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  externalSource: providerSourceEnum("external_source"),
  externalRef: text("external_ref"),
});

export type Provider = typeof providersTable.$inferSelect;
export type InsertProvider = typeof providersTable.$inferInsert;
