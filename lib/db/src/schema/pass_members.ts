import {
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { passesTable } from "./passes";
import { usersTable } from "./users";

export const passMemberRoleEnum = pgEnum("pass_member_role", [
  "owner",
  "holder",
  "buddy",
  "requested",
]);

export const passMembersTable = pgTable(
  "pass_members",
  {
    passId: uuid("pass_id")
      .notNull()
      .references(() => passesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: passMemberRoleEnum("role").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.passId, t.userId] }),
  }),
);

export const PassMemberRoleSchema = z.enum([
  "owner",
  "holder",
  "buddy",
  "requested",
]);

export type PassMember = typeof passMembersTable.$inferSelect;
export type InsertPassMember = typeof passMembersTable.$inferInsert;
