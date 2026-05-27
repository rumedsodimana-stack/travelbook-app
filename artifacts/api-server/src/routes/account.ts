import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";

import {
  documentInputSchema,
  documentsTable,
  notificationsTable,
  userPatchSchema,
  usersTable,
} from "@workspace/db";

import { getUserId } from "../lib/auth";
import { getDb } from "../lib/db";

const router: IRouter = Router();

router.get("/account/me", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    let user = rows[0];
    if (!user) {
      // first-touch dev seed
      const inserted = await db
        .insert(usersTable)
        .values({
          id: userId,
          email: "dev@travelbook.local",
          handle: "dev",
          name: "Dev User",
        })
        .returning();
      user = inserted[0]!;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch("/account/me", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const patch = userPatchSchema.parse(req.body);
    const updated = await db
      .update(usersTable)
      .set(patch)
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated[0]) return res.status(404).json({ error: "user_not_found" });
    return res.json(updated[0]);
  } catch (err) {
    return next(err);
  }
});

router.get("/account/documents", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const rows = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.userId, userId));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/account/documents", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const input = documentInputSchema.parse(req.body);
    const inserted = await db
      .insert(documentsTable)
      .values({
        ...input,
        userId,
        autofills: input.autofills ?? [],
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/account/documents/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const input = documentInputSchema.partial().parse(req.body);
    const updated = await db
      .update(documentsTable)
      .set(input)
      .where(eq(documentsTable.id, req.params.id!))
      .returning();
    if (!updated[0] || updated[0].userId !== userId) {
      return res.status(404).json({ error: "document_not_found" });
    }
    return res.json(updated[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/account/documents/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const rows = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, req.params.id!));
    const found = rows[0];
    if (!found || found.userId !== userId) {
      return res.status(404).json({ error: "document_not_found" });
    }
    await db.delete(documentsTable).where(eq(documentsTable.id, req.params.id!));
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

router.get("/account/inbox", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId));
    const filter = req.query.filter as string | undefined;
    const filtered =
      filter === "unread" ? rows.filter((r) => r.readAt == null) : rows;
    res.json({
      notifications: filtered,
      nextCursor: null,
      unreadCount: rows.filter((r) => r.readAt == null).length,
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/account/inbox/:id", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const read = Boolean(req.body?.read);
    const updated = await db
      .update(notificationsTable)
      .set({ readAt: read ? new Date() : null })
      .where(eq(notificationsTable.id, req.params.id!))
      .returning();
    if (!updated[0] || updated[0].userId !== userId) {
      return res.status(404).json({ error: "notification_not_found" });
    }
    return res.json(updated[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
