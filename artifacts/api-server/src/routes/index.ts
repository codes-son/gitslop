import { Router, type IRouter } from "express";
import healthRouter from "./health";
import webhookRouter from "./webhook";
import memesRouter from "./memes";
import memeImagesRouter from "./meme-images";

const router: IRouter = Router();

router.use(healthRouter);
router.use(memesRouter);
router.use(memeImagesRouter);
router.use(webhookRouter);

export default router;
