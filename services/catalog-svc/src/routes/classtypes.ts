import { Router } from "express";
import { prisma } from "../lib/prisma";
import requireAdmin from "../middleware/admin";

const router = Router();

/**
 * GET /classtypes
 * Public – list class types (optionally by category)
 * /classtypes?categoryId=...
 */
router.get("/", async (req, res) => {
  const { categoryId } = req.query;

  const classTypes = await prisma.classType.findMany({
    where: categoryId
      ? { categoryId: String(categoryId) }
      : undefined,
    include: {
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  res.json(classTypes);
});

/**
 * POST /classtypes
 * Admin – create new class type
 */
router.post("/", requireAdmin, async (req, res) => {
  const { name, categoryId } = req.body;

  if (!name || !categoryId) {
    return res.status(400).json({
      error: "name and categoryId are required",
    });
  }

  try {
    const classType = await prisma.classType.create({
      data: {
        name,
        categoryId,
      },
    });

    res.status(201).json(classType);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({
      error: "Failed to create class type",
    });
  }
});

export default router;
