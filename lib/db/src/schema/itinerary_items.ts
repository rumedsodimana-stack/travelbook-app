import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { passesTable } from "./passes";
import { providersTable } from "./providers";

export const itineraryKindEnum = pgEnum("itinerary_kind", [
  "flight",
  "stay",
  "activity",
  "transit",
  "dining",
  "insurance",
  "visa",
  "event",
  "entertainment",
]);
export const itineraryStateEnum = pgEnum("itinerary_state", [
  "draft",
  "confirmed",
  "past",
  "shifted",
  "swapped",
  "cancelled",
]);

export const itineraryItemsTable = pgTable("itinerary_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  passId: uuid("pass_id")
    .notNull()
    .references(() => passesTable.id, { onDelete: "cascade" }),
  sortAt: timestamp("sort_at", { withTimezone: true }).notNull(),
  kind: itineraryKindEnum("kind").notNull(),
  state: itineraryStateEnum("state").notNull().default("draft"),

  providerId: uuid("provider_id").references(() => providersTable.id, {
    onDelete: "set null",
  }),
  externalRef: text("external_ref"),

  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  code: text("code"),
  durationMinutes: integer("duration_minutes"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("USD"),

  /** Kind-specific shape per SPEC §4.5.1. App code casts per `kind`. */
  data: jsonb("data").notNull(),
});

export const ItineraryKindSchema = z.enum([
  "flight",
  "stay",
  "activity",
  "transit",
  "dining",
  "insurance",
  "visa",
  "event",
  "entertainment",
]);
export const ItineraryStateSchema = z.enum([
  "draft",
  "confirmed",
  "past",
  "shifted",
  "swapped",
  "cancelled",
]);

/** Per-kind data shapes — discriminated by parent `item.kind`. */
export const flightDataSchema = z.object({
  carrier: z.string(),
  flightNo: z.string(),
  depAirport: z.string().length(3),
  depTime: z.string(), // ISO timestamp with offset
  arrAirport: z.string().length(3),
  arrTime: z.string(),
  stops: z.array(z.string()).default([]),
  fare: z.string().optional(),
  seat: z.string().optional(),
  aircraft: z.string().optional(),
  meals: z.boolean().optional(),
  wifi: z.boolean().optional(),
});

export const stayDataSchema = z.object({
  name: z.string(),
  address: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  room: z.string().optional(),
  guests: z.number().int().min(1),
  view: z.string().optional(),
});

export const activityDataSchema = z.object({
  name: z.string(),
  venue: z.string(),
  starts: z.string(),
  ends: z.string(),
  tickets: z.number().int().min(1),
  code: z.string().optional(),
});

export const transitDataSchema = z.object({
  carrier: z.string(),
  service: z.string(),
  depStation: z.string(),
  arrStation: z.string(),
  depTime: z.string(),
  arrTime: z.string(),
  car: z.string().optional(),
  seat: z.string().optional(),
});

export const visaDataSchema = z.object({
  country: z.string().length(2),
  type: z.string(),
  validityDays: z.number().int().min(1),
  evisa: z.boolean(),
});

export const insuranceDataSchema = z.object({
  carrier: z.string(),
  tier: z.string(),
  coverage: z.string(),
  starts: z.string(),
  ends: z.string(),
});

export type ItineraryItem = typeof itineraryItemsTable.$inferSelect;
export type InsertItineraryItem = typeof itineraryItemsTable.$inferInsert;
export type ItineraryKind = z.infer<typeof ItineraryKindSchema>;
export type FlightData = z.infer<typeof flightDataSchema>;
export type StayData = z.infer<typeof stayDataSchema>;
export type ActivityData = z.infer<typeof activityDataSchema>;
export type TransitData = z.infer<typeof transitDataSchema>;
export type VisaData = z.infer<typeof visaDataSchema>;
export type InsuranceData = z.infer<typeof insuranceDataSchema>;
