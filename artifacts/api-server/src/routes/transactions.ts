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

router.post("/transactions/withdraw", requireAuth, async (req, res): Promise<void> => {
  const { amount, receiverPhone, note } = req.body;

  if (!amount || !receiverPhone) {
    res.status(400).json({ error: "Amount and receiver phone are required" });
    return;
  }

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const currentBalance = parseFloat(user.balance ?? "0");
  if (currentBalance < numAmount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  // Deduct balance immediately (locked while pending)
  await db.update(usersTable)
    .set({ balance: (currentBalance - numAmount).toFixed(2) })
    .where(eq(usersTable.id, req.session.userId!));

  const [transaction] = await db.insert(transactionsTable).values({
    userId: req.session.userId!,
    type: "withdrawal",
    amount: numAmount.toFixed(2),
    status: "pending",
    senderPhone: receiverPhone,
    note: note ?? null,
  }).returning();

  res.status(201).json({
    ...transaction,
    amount: parseFloat(transaction.amount ?? "0"),
  });
});

router.post("/transactions/game/bet", requireAuth, async (req, res): Promise<void> => {
  const { amount } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const currentBalance = parseFloat(user.balance ?? "0");
  if (currentBalance < numAmount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(usersTable)
    .set({ balance: (currentBalance - numAmount).toFixed(2) })
    .where(eq(usersTable.id, req.session.userId!));

  const [transaction] = await db.insert(transactionsTable).values({
    userId: req.session.userId!,
    type: "debit",
    amount: numAmount.toFixed(2),
    status: "approved",
    note: "Aviator bet",
  }).returning();

  res.json({
    ...transaction,
    amount: parseFloat(transaction.amount ?? "0"),
  });
});

router.post("/transactions/game/win", requireAuth, async (req, res): Promise<void> => {
  const { amount } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = parseFloat(user.balance ?? "0") + numAmount;
  await db.update(usersTable)
    .set({ balance: newBalance.toFixed(2) })
    .where(eq(usersTable.id, req.session.userId!));

  const [transaction] = await db.insert(transactionsTable).values({
    userId: req.session.userId!,
    type: "credit",
    amount: numAmount.toFixed(2),
    status: "approved",
    note: "Aviator win",
  }).returning();

  res.json({
    ...transaction,
    amount: parseFloat(transaction.amount ?? "0"),
  });
});

export default router;
