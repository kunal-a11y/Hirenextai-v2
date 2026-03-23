import { Router } from "express";
import { db, subscriptionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, AuthRequest } from "../middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, async (req: AuthRequest, res) => {
  let [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId!)).limit(1);

  if (!sub) {
    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      plan: "free",
      status: "active",
    });
    const [newSub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId!)).limit(1);
    sub = newSub;
  }

  res.json({
    id: sub.id,
    userId: sub.userId,
    plan: sub.plan,
    status: sub.status,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    cancelledAt: sub.cancelledAt?.toISOString() ?? null,
  });
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { plan } = req.body;
  if (!["free", "pro", "premium"].includes(plan)) {
    res.status(400).json({ error: "Bad Request", message: "Invalid plan" });
    return;
  }

  const periodEnd = plan === "free" ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [existing] = await db.select().from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.userId!)).limit(1);

  if (existing) {
    await db.update(subscriptionsTable)
      .set({
        plan,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionsTable.userId, req.userId!));

    const [sub] = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId!)).limit(1);

    await db.update(usersTable).set({ subscriptionPlan: plan, updatedAt: new Date() }).where(eq(usersTable.id, req.userId!));

    res.json({
      id: sub.id,
      userId: sub.userId,
      plan: sub.plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart.toISOString(),
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelledAt: sub.cancelledAt?.toISOString() ?? null,
    });
  } else {
    await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      plan,
      status: "active",
      currentPeriodEnd: periodEnd,
    });

    const [newSub] = await db.select().from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, req.userId!)).limit(1);

    await db.update(usersTable).set({ subscriptionPlan: plan, updatedAt: new Date() }).where(eq(usersTable.id, req.userId!));

    res.json({
      id: newSub.id,
      userId: newSub.userId,
      plan: newSub.plan,
      status: newSub.status,
      currentPeriodStart: newSub.currentPeriodStart.toISOString(),
      currentPeriodEnd: newSub.currentPeriodEnd?.toISOString() ?? null,
      cancelledAt: null,
    });
  }
});

export default router;
