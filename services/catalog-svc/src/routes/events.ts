import { Router } from "express";
import { prisma } from "../lib/prisma";
import requireAdmin from "../middleware/admin";

const router = Router();

/**
 * GET /events
 * Public – list published upcoming events
 */
router.get("/", async (_req, res) => {
  const now = new Date();

  const events = await prisma.timeSlot.findMany({
    where: {
      status: "published",
      startAt: { gte: now },
    },
    include: {
      classType: {
        include: {
          category: true,
        },
      },
      venue: true,
    },
    orderBy: {
      startAt: "asc",
    },
  });

  res.json(events);
});

/**
 * POST /events
 * Admin – publish new event (time slot)
 */
router.post("/", requireAdmin, async (req, res) => {
  const {
    title,
    classTypeId,
    venueId,
    startAt,
    endAt,
    capacity,
    price,
  } = req.body;

  // Validation
  if (
    !title ||
    !classTypeId ||
    !venueId ||
    !startAt ||
    !endAt ||
    capacity == null ||
    price == null
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const event = await prisma.timeSlot.create({
    data: {
      title,
      classTypeId,
      venueId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      capacity: Number(capacity),
      price: Number(price),
      status: "published",
    },
  });

  res.status(201).json(event);
});

export default router;
