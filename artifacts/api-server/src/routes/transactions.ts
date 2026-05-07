import { Router, type IRouter } from "express";
import { db, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const transactions = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.session.userId!))
    .orderBy(desc(transactionsTable.createdAt));

  res.json(transactions.map(t => ({
    ...t,
    amount: parseFloat(t.amount ?? "0"),
  })));
});

router.post("/transactions/deposit", requireAuth, async (req, res): Promise<void> => {
  const { amount, senderPhone, note } = req.body;

  if (!amount || !senderPhone) {
    res.status(400).json({ error: "Amount and sender phone are required" });
    return;
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [transaction] = await db.insert(transactionsTable).values({
    userId: req.session.userId!,
    type: "deposit",
    amount: numAmount.toFixed(2),
    status: "pending",
    senderPhone,
    note: note ?? null,
  }).returning();

  res.status(201).json({
    ...transaction,
    amount: parseFloat(transaction.amount ?? "0"),
  });
});

export default router;
