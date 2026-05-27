import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

import {
  buddyRequestsTable,
  createBuddyRequestSchema,
  notificationsTable,
  passMembersTable,
  passesTable,
  usersTable,
} from "@workspace/db";

import { getUserId } from "../lib/auth";
import { getDb } from "../lib/db";

const router: IRouter = Router();

router.get("/buddy-requests", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);

    const rows = await db
      .select({ req: buddyRequestsTable, requester: usersTable })
      .from(buddyRequestsTable)
      .innerJoin(passesTable, eq(buddyRequestsTable.passId, passesTable.id))
      .leftJoin(usersTable, eq(buddyRequestsTable.requesterId, usersTable.id))
      .where(eq(passesTable.userId, userId))
      .orderBy(desc(buddyRequestsTable.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.req,
        requester: r.requester
          ? {
              id: r.requester.id,
              handle: r.requester.handle,
              name: r.requester.name,
              avatarUrl: r.requester.avatarUrl,
            }
          : null,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/buddy-requests", async (req, res, next) => {
  try {
    const db = getDb();
    const requesterId = getUserId(req);
    const input = createBuddyRequestSchema.parse(req.body);

    // Compute fit-check vs pass owner's preferences
    const pass = (
      await db.select().from(passesTable).where(eq(passesTable.id, input.passId))
    )[0];
    if (!pass) return res.status(404).json({ error: "pass_not_found" });

    const owner = (
      await db.select().from(usersTable).where(eq(usersTable.id, pass.userId))
    )[0];
    const requester = (
      await db.select().from(usersTable).where(eq(usersTable.id, requesterId))
    )[0];
    const breakdown = computeFit(owner, requester);
    const score =
      Object.values(breakdown).filter((v) => v === "match").length /
      Object.values(breakdown).length;

    const inserted = (
      await db
        .insert(buddyRequestsTable)
        .values({
          passId: input.passId,
          requesterId,
          message: input.message,
          fitScore: score,
          fitBreakdown: breakdown,
        })
        .returning()
    )[0]!;

    // Notify owner
    await db.insert(notificationsTable).values({
      userId: pass.userId,
      kind: "buddy_request",
      title: `${requester?.handle ?? "Someone"} wants to join your ${pass.title}`,
      body: `Fit: ${Math.round(score * 4)}/4 match. Tap to review.`,
      deepLink: `/pass/${pass.id}/buddy-requests`,
    });

    return res.status(201).json(inserted);
  } catch (err) {
    return next(err);
  }
});

router.post("/buddy-requests/:id/decide", async (req, res, next) => {
  try {
    const db = getDb();
    const decision = String(req.body?.decision ?? "") as "accepted" | "declined";
    if (decision !== "accepted" && decision !== "declined") {
      return res.status(400).json({ error: "bad_decision" });
    }
    const updated = (
      await db
        .update(buddyRequestsTable)
        .set({ state: decision, decidedAt: new Date() })
        .where(eq(buddyRequestsTable.id, req.params.id!))
        .returning()
    )[0];
    if (!updated) return res.status(404).json({ error: "request_not_found" });

    if (decision === "accepted") {
      await db
        .insert(passMembersTable)
        .values({ passId: updated.passId, userId: updated.requesterId, role: "buddy" })
        .onConflictDoNothing();
      await db.insert(notificationsTable).values({
        userId: updated.requesterId,
        kind: "buddy_joined",
        title: "You're in.",
        body: "Welcome to the pass.",
        deepLink: `/pass/${updated.passId}`,
      });
    }

    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

function computeFit(
  owner: { prefPace?: unknown; prefBudget?: unknown; prefMornings?: unknown; prefDiet?: unknown } | undefined,
  requester: { prefPace?: unknown; prefBudget?: unknown; prefMornings?: unknown; prefDiet?: unknown } | undefined,
): Record<string, "match" | "soft" | "mismatch"> {
  function cmp(a: unknown, b: unknown): "match" | "soft" | "mismatch" {
    if (!a || !b) return "soft";
    return a === b ? "match" : "mismatch";
  }
  return {
    pace: cmp(owner?.prefPace, requester?.prefPace),
    budget: cmp(owner?.prefBudget, requester?.prefBudget),
    mornings: cmp(owner?.prefMornings, requester?.prefMornings),
    diet: cmp(owner?.prefDiet, requester?.prefDiet),
  };
}

export default router;
