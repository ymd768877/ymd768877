import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import gamesRouter from "./games";
import announcementsRouter from "./announcements";
import promotionsRouter from "./promotions";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gamesRouter);
router.use(announcementsRouter);
router.use(promotionsRouter);
router.use(transactionsRouter);
router.use(adminRouter);

export default router;
