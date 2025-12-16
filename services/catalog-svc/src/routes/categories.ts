import { Router } from "express";
import { prisma } from "../lib/prisma";
import requireAdmin from "../middleware/admin";

const router = Router();

/**
 * GET /categories
 * Public – list all categories
 */
router.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  res.json(categories);
});

/**
 * POST /categories
 * Admin – create new category
 */
router.post("/", requireAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json(category);
  } catch (e: any) {
    // Prisma unique constraint violation
    if (e.code === "P2002") {
      return res.status(409).json({ error: "Category already exists" });
    }

    console.error(e);
    res.status(500).json({ error: "Failed to create category" });
  }
});

export default router;
