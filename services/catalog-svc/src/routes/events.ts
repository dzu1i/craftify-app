import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";

export const eventRouter = Router();

/**
 * GET /events
 * Public list of published upcoming events
 */
eventRouter.get("/", async (_req, res) => {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: {
      status: "published",
      startAt: { gte: now },
    },
    include: {
      category: true,
      location: true,
    },
    orderBy: { startAt: "asc" },
  });

  res.json(events);
});

/**
 * POST /events
 * Publish availability (admin only)
 */
eventRouter.post("/", requireAdmin, async (req, res) => {
  const {
    title,
    categoryId,
    locationId,
    startAt,
    endAt,
    capacity,
    priceCents,
    description,
  } = req.body;

  if (!title || !categoryId || !locationId || !startAt || !endAt) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      categoryId,
      locationId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      capacity: Number(capacity),
      priceCents: Number(priceCents),
    },
  });

  (req as any).auditEntityType = "Event";
  (req as any).auditEntityId = event.id;
  (req as any).auditPayload = req.body;

  res.status(201).json(event);
});
