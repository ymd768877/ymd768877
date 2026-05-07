import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { username, phone, password } = req.body;

  if (!username || !phone || !password) {
    res.status(400).json({ error: "Username, phone and password are required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing.length > 0) {
    res.status(400).json({ error: "Phone number already registered" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username,
    phone,
    password: hashed,
    balance: "0",
    status: "active",
    role: "user",
  }).returning();

  req.session.userId = user.id;
  req.session.role = user.role;

  const { password: _, ...safeUser } = user;
  const userWithBalance = {
    ...safeUser,
    balance: parseFloat(safeUser.balance ?? "0"),
  };

  logger.info({ userId: user.id }, "User registered");
  res.status(201).json({ user: userWithBalance, token: `session-${user.id}` });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    res.status(400).json({ error: "Phone and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));

  if (!user) {
    res.status(401).json({ error: "Invalid phone or password" });
    return;
  }

  if (user.status === "banned") {
    res.status(401).json({ error: "Your account has been banned" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid phone or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  const { password: _, ...safeUser } = user;
  const userWithBalance = {
    ...safeUser,
    balance: parseFloat(safeUser.balance ?? "0"),
  };

  logger.info({ userId: user.id }, "User logged in");
  res.json({ user: userWithBalance, token: `session-${user.id}` });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const { password: _, ...safeUser } = user;
  res.json({
    ...safeUser,
    balance: parseFloat(safeUser.balance ?? "0"),
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
