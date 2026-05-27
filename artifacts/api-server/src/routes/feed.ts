import { desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";

import {
  createPostSchema,
  passesTable,
  postsTable,
  usersTable,
} from "@workspace/db";

import { getUserId } from "../lib/auth";
import { getDb } from "../lib/db";

const router: IRouter = Router();

router.get("/feed", async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await db
      .select({
        post: postsTable,
        author: usersTable,
        pass: passesTable,
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .leftJoin(passesTable, eq(postsTable.passId, passesTable.id))
      .orderBy(desc(postsTable.createdAt))
      .limit(40);

    const posts = rows.map((r) => ({
      ...r.post,
      author: r.author
        ? {
            id: r.author.id,
            handle: r.author.handle,
            name: r.author.name,
            avatarUrl: r.author.avatarUrl,
          }
        : null,
      pass: r.pass ?? null,
    }));

    res.json({ posts, nextCursor: null });
  } catch (err) {
    next(err);
  }
});

router.post("/posts", async (req, res, next) => {
  try {
    const db = getDb();
    const userId = getUserId(req);
    const input = createPostSchema.parse(req.body);
    const inserted = (
      await db
        .insert(postsTable)
        .values({
          authorId: userId,
          kind: input.kind,
          caption: input.caption,
          photoUrls: input.photoUrls,
          passId: input.passId ?? null,
          visibility: input.visibility,
        })
        .returning()
    )[0]!;
    res.status(201).json(inserted);
  } catch (err) {
    next(err);
  }
});

router.post("/posts/:id/like", async (req, res, next) => {
  try {
    const db = getDb();
    const updated = (
      await db
        .update(postsTable)
        .set({ likesCount: sql`${postsTable.likesCount} + 1` })
        .where(eq(postsTable.id, req.params.id!))
        .returning()
    )[0];
    if (!updated) return res.status(404).json({ error: "post_not_found" });
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
});

export default router;
