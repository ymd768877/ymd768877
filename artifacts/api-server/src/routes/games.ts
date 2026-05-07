import { Router, type IRouter } from "express";
import { db, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/games", async (req, res): Promise<void> => {
  const { category } = req.query;

  let games;
  if (category && category !== "all") {
    games = await db.select().from(gamesTable)
      .where(eq(gamesTable.category, category as "hot" | "favorites" | "slots"))
      .orderBy(gamesTable.createdAt);
  } else {
    games = await db.select().from(gamesTable).orderBy(gamesTable.createdAt);
  }

  res.json(games.filter(g => g.isActive));
});

export default router;
