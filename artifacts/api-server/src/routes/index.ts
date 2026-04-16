import { Router, type IRouter } from "express";
import healthRouter from "./health";
import planRouter from "./plan";
import searchRouter from "./search";
import bookRouter from "./book";
import providersRouter from "./providers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(planRouter);
router.use(searchRouter);
router.use(bookRouter);
router.use(providersRouter);

export default router;
