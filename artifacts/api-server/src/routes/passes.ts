import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";

import {
  itineraryItemsTable,
  notificationsTable,
  passMembersTable,
  passesTable,
  postsTable,
  type Pass,
} from "@workspace/db";

import { getUserId } from "../lib/auth";
import { getDb } from "../lib/db";

const router: IRouter = Router();

router.get("/passes", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const stateFilter = String(req.query.state ?? "")
      .split(",")
      .filter(Boolean) as Pass["state"][];

    let rows = await db
      .select({ pass: passesTable })
      .from(passMembersTable)
      .innerJoin(passesTable, eq(passMembersTable.passId, passesTable.id))
      .where(eq(passMembersTable.userId, userId))
      .orderBy(desc(passesTable.startsOn));

    let passes = rows.map((r) => r.pass);
    if (stateFilter.length) {
      passes = passes.filter((p) => stateFilter.includes(p.state));
    }

    const grouped = {
      live: passes.filter((p) => p.state === "live"),
      upcoming: passes.filter((p) => p.state === "upcoming"),
      drafts: passes.filter((p) => p.state === "draft"),
      archived: passes.filter((p) => p.state === "archived"),
    };
    res.json(grouped);
  } catch (err) {
    next(err);
  }
});

router.get("/passes/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const passId = req.params.id!;
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

router.get("/passes/:id/next-up", async (req, res, next) => {
  try {
    const db = getDb();
    const passId = req.params.id!;
    const rows = await db
      .select()
      .from(itineraryItemsTable)
      .where(eq(itineraryItemsTable.passId, passId));
    const now = Date.now();
    const upcoming = rows
      .filter(
        (r) =>
          r.state !== "cancelled" &&
          r.sortAt instanceof Date &&
          r.sortAt.getTime() > now,
      )
      .sort((a, b) => a.sortAt.getTime() - b.sortAt.getTime());
    const item = upcoming[0] ?? null;
    const minutesUntil = item ? Math.round((item.sortAt.getTime() - now) / 60_000) : null;
    const nudge =
      item && minutesUntil! < 90
        ? `Time to head to ${item.title}`
        : null;
    res.json({ item, minutesUntil, nudge });
  } catch (err) {
    next(err);
  }
});

router.post("/passes/:id/share", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const passId = req.params.id!;
    const visibility = String(req.body?.visibility ?? "friends") as
      | "private"
      | "link"
      | "friends"
      | "public";
    const openSeats = Number(req.body?.openSeats ?? 0);
    const seatsClosesAt = req.body?.seatsClosesAt
      ? new Date(req.body.seatsClosesAt)
      : null;
    const caption = String(req.body?.caption ?? "");

    await db
      .update(passesTable)
      .set({
        visibility,
        openSeats,
        seatsClosesAt,
        updatedAt: new Date(),
      })
      .where(and(eq(passesTable.id, passId), eq(passesTable.userId, userId)));

    const post = (
      await db
        .insert(postsTable)
        .values({
          authorId: userId,
          kind: "pass_share",
          passId,
          caption,
          visibility: visibility === "private" ? "friends" : visibility,
        })
        .returning()
    )[0]!;

    return res.status(201).json({
      ...post,
      author: { id: userId, handle: "dev", name: "Dev User" },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
