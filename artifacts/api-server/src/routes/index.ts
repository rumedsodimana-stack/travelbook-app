import { Router, type IRouter } from "express";
import healthRouter from "./health";
import planRouter from "./plan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(planRouter);

export default router;
