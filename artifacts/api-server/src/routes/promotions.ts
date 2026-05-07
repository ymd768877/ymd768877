import { Router, type IRouter } from "express";
import { db, promotionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/promotions", async (_req, res): Promise<void> => {
  const promotions = await db.select().from(promotionsTable)
    .where(eq(promotionsTable.isActive, true))
    .orderBy(promotionsTable.createdAt);
  res.json(promotions);
});

export default router;
