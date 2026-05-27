import {
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { usersTable } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "passport",
  "national_id",
  "ktn",
  "drivers_license",
  "visa",
]);

export const documentsTable = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  issuingCountry: text("issuing_country").notNull(),

  // TODO: v2 — wrap with KMS per-row data key (envelope encryption).
  // Document numbers must never be logged in plain. See SPEC §6.4.
  number: text("number").notNull(),
  issuedOn: date("issued_on").notNull(),
  expiresOn: date("expires_on"),

  holderName: text("holder_name").notNull(),
  holderDob: date("holder_dob").notNull(),
  holderSex: text("holder_sex"),

  // jsonb encrypted blob (e.g. NFC chip data); stub for v1
  chipData: jsonb("chip_data"),

  // Signed-URL pointers; stub for v1 — manual entry has no scan upload yet.
  scanFrontUrl: text("scan_front_url"),
  scanBackUrl: text("scan_back_url"),

  // Which contexts this document auto-fills (visa, flights, airport, domestic)
  autofills: text("autofills").array().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const DocumentTypeSchema = z.enum([
  "passport",
  "national_id",
  "ktn",
  "drivers_license",
  "visa",
]);

export const documentInputSchema = z.object({
  type: DocumentTypeSchema,
  issuingCountry: z.string().length(2),
  number: z.string().min(3).max(64),
  issuedOn: z.string(), // ISO date
  expiresOn: z.string().nullable().optional(),
  holderName: z.string().min(1).max(120),
  holderDob: z.string(),
  holderSex: z.string().max(1).nullable().optional(),
  autofills: z.array(z.string()).optional(),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = typeof documentsTable.$inferInsert;
export type DocumentInput = z.infer<typeof documentInputSchema>;
