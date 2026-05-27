import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const themeEnum = pgEnum("theme", ["stamped", "wallet", "ticket"]);
export const paceEnum = pgEnum("pace", ["slow", "steady", "packed"]);
export const budgetEnum = pgEnum("budget", ["lean", "mid", "splurge"]);
export const morningsEnum = pgEnum("mornings", ["sleep_in", "coffee", "early"]);
export const dietEnum = pgEnum("diet", [
  "any",
  "pescatarian",
  "vegetarian",
  "vegan",
]);
export const visibilityEnum = pgEnum("user_visibility", [
  "public",
  "friends",
  "private",
]);

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  handle: text("handle").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),

  theme: themeEnum("theme").notNull().default("stamped"),
  autoTheme: boolean("auto_theme").notNull().default(false),

  prefPace: paceEnum("pref_pace"),
  prefBudget: budgetEnum("pref_budget"),
  prefMornings: morningsEnum("pref_mornings"),
  prefDiet: dietEnum("pref_diet"),
  prefInterests: text("pref_interests").array(),

  visibility: visibilityEnum("visibility").notNull().default("friends"),
  currency: text("currency").notNull().default("USD"),
  isVerified: boolean("is_verified").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ThemeSchema = z.enum(["stamped", "wallet", "ticket"]);
export const PaceSchema = z.enum(["slow", "steady", "packed"]);
export const BudgetSchema = z.enum(["lean", "mid", "splurge"]);
export const MorningsSchema = z.enum(["sleep_in", "coffee", "early"]);
export const DietSchema = z.enum(["any", "pescatarian", "vegetarian", "vegan"]);
export const VisibilitySchema = z.enum(["public", "friends", "private"]);

export const userPrefsPatchSchema = z.object({
  prefPace: PaceSchema.optional(),
  prefBudget: BudgetSchema.optional(),
  prefMornings: MorningsSchema.optional(),
  prefDiet: DietSchema.optional(),
  prefInterests: z.array(z.string()).optional(),
});

export const userPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    handle: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[a-z0-9._]+$/)
      .optional(),
    phone: z.string().nullable().optional(),
    avatarUrl: z.string().url().nullable().optional(),
    theme: ThemeSchema.optional(),
    autoTheme: z.boolean().optional(),
    visibility: VisibilitySchema.optional(),
    currency: z.string().length(3).optional(),
  })
  .merge(userPrefsPatchSchema);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type UserPatch = z.infer<typeof userPatchSchema>;
