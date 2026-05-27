import { randomBytes, randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

import {
  alternatesTable,
  itineraryItemsTable,
  passMembersTable,
  passesTable,
  type InsertAlternate,
  type InsertItineraryItem,
} from "@workspace/db";

import { getUserId } from "../lib/auth";
import { getDb } from "../lib/db";
import { openStream } from "../lib/sse";
import { enqueue, take } from "../lib/build-queue";
import {
  runBuild,
  type BuildEvent,
  type BuildItem,
} from "../planner/build";
import { matchDestination } from "../planner/fixtures";
import { generateAlternates } from "../planner/alternates";

const router: IRouter = Router();

function newCode(destinationKey: string): string {
  const cc = (destinationKey || "tb").slice(0, 2).toUpperCase();
  const n = randomBytes(4).readUInt32BE(0) % 100_000_000;
  return `${cc}-${String(n).padStart(8, "0")}`;
}

// POST /planner/build — create draft pass, enqueue build, return passId + buildId
router.post("/planner/build", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);

    const prompt = String(req.body?.prompt ?? "").slice(0, 1000);
    if (!prompt.trim()) return res.status(400).json({ error: "prompt_required" });

    const destinationKey =
      matchDestination(prompt) ?? ("japan" as const);

    // Default dates: 30 days out, 7-day trip (overridden by build pipeline if user provides).
    const today = new Date();
    const start = req.body?.dates?.start
      ? new Date(req.body.dates.start)
      : new Date(today.getTime() + 30 * 24 * 3600 * 1000);
    const end = req.body?.dates?.end
      ? new Date(req.body.dates.end)
      : new Date(start.getTime() + 7 * 24 * 3600 * 1000);

    const code = newCode(destinationKey);
    const title = `${destinationKey[0]!.toUpperCase()}${destinationKey.slice(1)} draft`;

    const inserted = await db
      .insert(passesTable)
      .values({
        userId,
        code,
        title,
        startsOn: start.toISOString().slice(0, 10),
        endsOn: end.toISOString().slice(0, 10),
        state: "draft",
        aiPrompt: prompt,
      })
      .returning();
    const pass = inserted[0]!;

    // Owner membership
    await db.insert(passMembersTable).values({
      passId: pass.id,
      userId,
      role: "owner",
    });

    const buildId = randomUUID();

    // Kick off the build in the background. Items are persisted as they arrive,
    // so clients can poll GET /api/planner/{passId} to see progress.
    // Optionally clients can subscribe to /api/planner/{passId}/build-stream
    // for an SSE event feed, but it's not required.
    void runBuildInBackground(pass.id, destinationKey, {
      prompt,
      preferences: req.body?.preferences,
      travelers: req.body?.travelers,
      dates: req.body?.dates,
      budgetUsd: req.body?.budgetUsd,
    });

    return res.status(202).json({ passId: pass.id, buildId });
  } catch (err) {
    return next(err);
  }
});

// GET /planner/:passId/build-stream — optional SSE feed of the in-flight build.
// v1 mobile polls /planner/:passId instead; this endpoint stays available for
// future web clients with native SSE support.
router.get("/planner/:passId/build-stream", async (req, res, next) => {
  try {
    const passId = req.params.passId!;
    const queued = take(passId);
    if (!queued) return res.status(410).json({ error: "build_unavailable_or_consumed" });

    const sse = openStream(res);

    try {
      for await (const ev of queued.iterable) {
        sse.send(ev as BuildEvent);
        if (sse.closed) break;
      }
      sse.send({ kind: "stream_done" });
    } catch (loopErr) {
      sse.send({
        kind: "error",
        message: loopErr instanceof Error ? loopErr.message : String(loopErr),
      });
    } finally {
      sse.close();
    }
    return;
  } catch (err) {
    return next(err);
  }
});

/**
 * Drive the build to completion in the background, persisting items + alternates
 * as they arrive. Errors are swallowed (logged); the partial state remains in DB
 * so the client can pick up what landed.
 */
async function runBuildInBackground(
  passId: string,
  destinationKey: string,
  input: Parameters<typeof runBuild>[0],
): Promise<void> {
  const db = getDb();
  try {
    for await (const ev of runBuild(input)) {
      if (ev.kind === "item") {
        await persistItem(db, passId, destinationKey, ev.item);
      }
    }
    await db
      .update(passesTable)
      .set({ aiBuiltAt: new Date(), updatedAt: new Date() })
      .where(eq(passesTable.id, passId));
  } catch (err) {
    console.error("background build failed", err);
  }
}

async function persistItem(
  db: ReturnType<typeof getDb>,
  passId: string,
  destinationKey: string,
  item: BuildItem,
): Promise<unknown> {
  const insertValue: InsertItineraryItem = {
    passId,
    sortAt: new Date(item.sortAt),
    kind: item.kind,
    state: "draft",
    title: item.title,
    subtitle: item.subtitle,
    code: item.code,
    cost: String(item.cost),
    currency: "USD",
    data: item.data,
  };
  const inserted = await db
    .insert(itineraryItemsTable)
    .values(insertValue)
    .returning();
  const dbItem = inserted[0]!;

  // Generate + persist alternates
  const alts = generateAlternates({ ...item, id: dbItem.id }, destinationKey as never);
  if (alts.length > 0) {
    const altRows: InsertAlternate[] = alts.map((a) => ({
      itemId: dbItem.id,
      rank: a.rank,
      data: a.data,
      tags: a.tags,
      deltaCost: a.deltaCost ? String(a.deltaCost) : null,
      deltaMinutes: a.deltaMinutes,
      score: a.score,
    }));
    await db.insert(alternatesTable).values(altRows);
  }

  return { ...dbItem, alternatesCount: alts.length };
}

// GET /planner/:passId — full pass with items + members
router.get("/planner/:passId", async (req, res, next) => {
  try {
    const db = getDb();
    const passId = req.params.passId!;
    const pass = (
      await db.select().from(passesTable).where(eq(passesTable.id, passId))
    )[0];
    if (!pass) return res.status(404).json({ error: "pass_not_found" });

    const items = await db
      .select()
      .from(itineraryItemsTable)
      .where(eq(itineraryItemsTable.passId, passId));
    const members = await db
      .select()
      .from(passMembersTable)
      .where(eq(passMembersTable.passId, passId));

    return res.json({ pass, items, members });
  } catch (err) {
    return next(err);
  }
});

// PATCH /planner/:passId/items/:itemId — mutate state or data
router.patch("/planner/:passId/items/:itemId", async (req, res, next) => {
  try {
    const db = getDb();
    const passId = req.params.passId!;
    const itemId = req.params.itemId!;
    const patch: Record<string, unknown> = {};
    if (typeof req.body?.state === "string") patch.state = req.body.state;
    if (typeof req.body?.sortAt === "string") patch.sortAt = new Date(req.body.sortAt);
    if (req.body?.data) patch.data = req.body.data;
    await db
      .update(itineraryItemsTable)
      .set(patch)
      .where(
        and(
          eq(itineraryItemsTable.id, itemId),
          eq(itineraryItemsTable.passId, passId),
        ),
      );
    // Return full pass with reshuffled items (engine integration is a follow-up)
    return res.redirect(303, `/api/planner/${passId}`);
  } catch (err) {
    return next(err);
  }
});

// POST /planner/:passId/items/:itemId/swap — swap with an alternate
router.post("/planner/:passId/items/:itemId/swap", async (req, res, next) => {
  try {
    const db = getDb();
    const passId = req.params.passId!;
    const itemId = req.params.itemId!;
    const alternateId = String(req.body?.alternateId ?? "");
    if (!alternateId) return res.status(400).json({ error: "alternateId_required" });
    const alt = (
      await db.select().from(alternatesTable).where(eq(alternatesTable.id, alternateId))
    )[0];
    if (!alt || alt.itemId !== itemId) {
      return res.status(404).json({ error: "alternate_not_found" });
    }
    await db
      .update(itineraryItemsTable)
      .set({ data: alt.data, state: "swapped" })
      .where(eq(itineraryItemsTable.id, itemId));
    return res.redirect(303, `/api/planner/${passId}`);
  } catch (err) {
    return next(err);
  }
});

// POST /planner/:passId/book-all — mock-confirm everything; pass → upcoming
router.post("/planner/:passId/book-all", async (req, res, next) => {
  try {
    const db = getDb();
    const passId = req.params.passId!;
    await db
      .update(itineraryItemsTable)
      .set({ state: "confirmed" })
      .where(eq(itineraryItemsTable.passId, passId));
    await db
      .update(passesTable)
      .set({ state: "upcoming", updatedAt: new Date() })
      .where(eq(passesTable.id, passId));
    return res.redirect(303, `/api/planner/${passId}`);
  } catch (err) {
    return next(err);
  }
});

// GET /items/:itemId/alternates
router.get("/items/:itemId/alternates", async (req, res, next) => {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(alternatesTable)
      .where(eq(alternatesTable.itemId, req.params.itemId!));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
