import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";

import accountRouter from "./account";
import bookRouter from "./book";
import buddiesRouter from "./buddies";
import feedRouter from "./feed";
import healthRouter from "./health";
import passesRouter from "./passes";
import plannerRouter from "./planner";
import providersRouter from "./providers";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);

// v1 — TravelBook spec endpoints
router.use(accountRouter);
router.use(plannerRouter);
router.use(passesRouter);
router.use(feedRouter);
router.use(buddiesRouter);

// Legacy provider integration layer (kept for v2 provider sourcing)
router.use(searchRouter);
router.use(bookRouter);
router.use(providersRouter);

// Centralised error handler. Express 5 forwards thrown errors to next() automatically.
router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: unknown; message?: string };
  if (typeof e?.status === "number" && e.status >= 400 && e.status < 600) {
    res.status(e.status).json({ error: e.message ?? "error" });
    return;
  }
  if (err instanceof Error && /Invalid|required/i.test(err.message)) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "internal_error" });
});

export default router;
