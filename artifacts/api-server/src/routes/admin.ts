import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, transactionsTable, announcementsTable, gamesTable, promotionsTable } from "@workspace/db";
import { eq, desc, count, sum, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable)
    .where(and(eq(usersTable.username, username), eq(usersTable.role, "admin")));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  const { password: _, ...safeUser } = user;
  res.json({
    user: { ...safeUser, balance: parseFloat(safeUser.balance ?? "0") },
    token: `admin-session-${user.id}`,
  });
});

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user"));
  const [activeUsersResult] = await db.select({ count: count() }).from(usersTable)
    .where(and(eq(usersTable.role, "user"), eq(usersTable.status, "active")));
  const [pendingDepositsResult] = await db.select({ count: count() }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "pending")));
  const [totalDepositedResult] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "approved")));
  const [totalBalanceResult] = await db.select({ total: sum(usersTable.balance) }).from(usersTable)
    .where(eq(usersTable.role, "user"));

  const recentTransactions = await db.select({
    id: transactionsTable.id,
    userId: transactionsTable.userId,
    type: transactionsTable.type,
    amount: transactionsTable.amount,
    status: transactionsTable.status,
    note: transactionsTable.note,
    senderPhone: transactionsTable.senderPhone,
    createdAt: transactionsTable.createdAt,
    user: {
      id: usersTable.id,
      username: usersTable.username,
      phone: usersTable.phone,
      balance: usersTable.balance,
      status: usersTable.status,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    },
  }).from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(10);

  const recentUsers = await db.select().from(usersTable)
    .where(eq(usersTable.role, "user"))
    .orderBy(desc(usersTable.createdAt))
    .limit(5);

  res.json({
    totalUsers: totalUsersResult.count,
    activeUsers: activeUsersResult.count,
    pendingDeposits: pendingDepositsResult.count,
    totalDeposited: parseFloat(totalDepositedResult.total ?? "0"),
    totalBalance: parseFloat(totalBalanceResult.total ?? "0"),
    recentTransactions: recentTransactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount ?? "0"),
      user: t.user ? { ...t.user, balance: parseFloat(t.user.balance ?? "0") } : undefined,
    })),
    recentUsers: recentUsers.map(u => ({ ...u, balance: parseFloat(u.balance ?? "0") })),
  });
});

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => {
    const { password: _, ...safe } = u;
    return { ...safe, balance: parseFloat(safe.balance ?? "0") };
  }));
});

router.put("/admin/users/:userId/balance", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  const { amount, type } = req.body;

  if (!amount || !type) {
    res.status(400).json({ error: "Amount and type are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const currentBalance = parseFloat(user.balance ?? "0");
  const changeAmount = parseFloat(amount);
  let newBalance: number;

  if (type === "add") {
    newBalance = currentBalance + changeAmount;
  } else if (type === "subtract") {
    newBalance = Math.max(0, currentBalance - changeAmount);
  } else {
    newBalance = changeAmount;
  }

  const [updated] = await db.update(usersTable)
    .set({ balance: newBalance.toFixed(2) })
    .where(eq(usersTable.id, userId))
    .returning();

  const { password: _, ...safe } = updated;
  logger.info({ userId, type, amount, newBalance }, "Admin updated balance");
  res.json({ ...safe, balance: parseFloat(safe.balance ?? "0") });
});

router.put("/admin/users/:userId/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: "Status is required" });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({ status })
    .where(eq(usersTable.id, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { password: _, ...safe } = updated;
  res.json({ ...safe, balance: parseFloat(safe.balance ?? "0") });
});

router.get("/admin/transactions", requireAdmin, async (req, res): Promise<void> => {
  const { status } = req.query;

  let query = db.select({
    id: transactionsTable.id,
    userId: transactionsTable.userId,
    type: transactionsTable.type,
    amount: transactionsTable.amount,
    status: transactionsTable.status,
    note: transactionsTable.note,
    senderPhone: transactionsTable.senderPhone,
    createdAt: transactionsTable.createdAt,
    user: {
      id: usersTable.id,
      username: usersTable.username,
      phone: usersTable.phone,
      balance: usersTable.balance,
      status: usersTable.status,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    },
  }).from(transactionsTable)
    .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .orderBy(desc(transactionsTable.createdAt))
    .$dynamic();

  if (status && typeof status === "string") {
    query = query.where(eq(transactionsTable.status, status as "pending" | "approved" | "rejected"));
  }

  const transactions = await query;

  res.json(transactions.map(t => ({
    ...t,
    amount: parseFloat(t.amount ?? "0"),
    user: t.user ? { ...t.user, balance: parseFloat(t.user.balance ?? "0") } : undefined,
  })));
});

router.put("/admin/transactions/:transactionId/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.transactionId) ? req.params.transactionId[0] : req.params.transactionId;
  const transactionId = parseInt(raw, 10);
  const { status, note } = req.body;

  if (!status) {
    res.status(400).json({ error: "Status is required" });
    return;
  }

  const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, transactionId));
  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const [updated] = await db.update(transactionsTable)
    .set({ status, note: note ?? transaction.note })
    .where(eq(transactionsTable.id, transactionId))
    .returning();

  if (status === "approved" && transaction.type === "deposit") {
    const depositAmount = parseFloat(transaction.amount ?? "0");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, transaction.userId));
    if (user) {
      const newBalance = parseFloat(user.balance ?? "0") + depositAmount;
      await db.update(usersTable)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(usersTable.id, transaction.userId));
    }
    logger.info({ transactionId, userId: transaction.userId, amount: depositAmount }, "Deposit approved, balance updated");
  }

  // Withdrawal rejected = refund balance
  if (status === "rejected" && transaction.type === "withdrawal" && transaction.status === "pending") {
    const withdrawAmount = parseFloat(transaction.amount ?? "0");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, transaction.userId));
    if (user) {
      const newBalance = parseFloat(user.balance ?? "0") + withdrawAmount;
      await db.update(usersTable)
        .set({ balance: newBalance.toFixed(2) })
        .where(eq(usersTable.id, transaction.userId));
    }
    logger.info({ transactionId, userId: transaction.userId, amount: withdrawAmount }, "Withdrawal rejected, balance refunded");
  }

  res.json({ ...updated, amount: parseFloat(updated.amount ?? "0") });
});

router.get("/admin/announcements", requireAdmin, async (_req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
  res.json(announcements);
});

router.post("/admin/announcements", requireAdmin, async (req, res): Promise<void> => {
  const { message, isActive } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const [announcement] = await db.insert(announcementsTable)
    .values({ message, isActive: isActive ?? true })
    .returning();

  res.status(201).json(announcement);
});

router.put("/admin/announcements/:announcementId", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.announcementId) ? req.params.announcementId[0] : req.params.announcementId;
  const announcementId = parseInt(raw, 10);
  const { message, isActive } = req.body;

  const [updated] = await db.update(announcementsTable)
    .set({ message, isActive })
    .where(eq(announcementsTable.id, announcementId))
    .returning();

  res.json(updated);
});

router.delete("/admin/announcements/:announcementId", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.announcementId) ? req.params.announcementId[0] : req.params.announcementId;
  const announcementId = parseInt(raw, 10);

  await db.delete(announcementsTable).where(eq(announcementsTable.id, announcementId));
  res.json({ success: true });
});

router.post("/admin/games", requireAdmin, async (req, res): Promise<void> => {
  const { name, category, provider, imageUrl, multiplier, isActive } = req.body;

  if (!name || !category || !provider || !imageUrl) {
    res.status(400).json({ error: "Name, category, provider and imageUrl are required" });
    return;
  }

  const [game] = await db.insert(gamesTable)
    .values({ name, category, provider, imageUrl, multiplier, isActive: isActive ?? true })
    .returning();

  res.status(201).json(game);
});

router.put("/admin/games/:gameId", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.gameId) ? req.params.gameId[0] : req.params.gameId;
  const gameId = parseInt(raw, 10);
  const { name, category, provider, imageUrl, multiplier, isActive } = req.body;

  const [updated] = await db.update(gamesTable)
    .set({ name, category, provider, imageUrl, multiplier, isActive })
    .where(eq(gamesTable.id, gameId))
    .returning();

  res.json(updated);
});

router.delete("/admin/games/:gameId", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.gameId) ? req.params.gameId[0] : req.params.gameId;
  const gameId = parseInt(raw, 10);

  await db.delete(gamesTable).where(eq(gamesTable.id, gameId));
  res.json({ success: true });
});

router.post("/admin/promotions", requireAdmin, async (req, res): Promise<void> => {
  const { title, description, imageUrl, isActive } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: "Title and description are required" });
    return;
  }

  const [promotion] = await db.insert(promotionsTable)
    .values({ title, description, imageUrl, isActive: isActive ?? true })
    .returning();

  res.status(201).json(promotion);
});

export default router;
