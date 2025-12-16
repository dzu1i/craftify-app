import { Router } from "express";
import { prisma } from "../lib/prisma";
import requireAdmin from "../middleware/admin";

const router = Router();

/**
 * GET /venues
 * Public – list all venues
 */
router.get("/", async (_req, res) => {
  const venues = await prisma.venue.findMany({
    orderBy: { name: "asc" },
  });

  res.json(venues);
});

/**
 * POST /venues
 * Admin – create venue
 */
router.post("/", requireAdmin, async (req, res) => {
  const { name, address, city } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name is required" });
  }

  const venue = await prisma.venue.create({
    data: {
      name,
      address: address ?? null,
      city: city ?? null,
    },
  });

  res.status(201).json(venue);
});

export default router;
