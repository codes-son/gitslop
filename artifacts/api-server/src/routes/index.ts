import { Router, type IRouter } from "express";
import healthRouter from "./health";
import webhookRouter from "./webhook";
import memesRouter from "./memes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memesRouter);
router.use(webhookRouter);

export default router;
