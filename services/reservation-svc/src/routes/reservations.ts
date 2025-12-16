import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * POST /reservations
 * Create reservation for logged user
 */
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const { timeSlotId } = req.body;

  if (!timeSlotId) {
    return res.status(400).json({ error: "timeSlotId is required" });
  }

  // 1️⃣ check capacity
  const slot = await prisma.timeSlot.findUnique({
    where: { id: timeSlotId },
    include: {
      reservations: {
        where: { status: "booked" },
      },
    },
  });

  if (!slot) {
    return res.status(404).json({ error: "Event not found" });
  }

  if (slot.reservations.length >= slot.capacity) {
    return res.status(409).json({ error: "Event is full" });
  }

  // 2️⃣ create reservation
  const reservation = await prisma.reservation.create({
    data: {
      userId,
      timeSlotId,
    },
  });

  res.status(201).json(reservation);
});

/**
 * GET /me/reservations
 */
router.get("/me", requireAuth, async (req, res) => {
  const userId = req.user!.sub;

  const reservations = await prisma.reservation.findMany({
    where: { userId },
    include: {
      timeSlot: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json(reservations);
});

/**
 * PATCH /reservations/:id/cancel
 */
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const { id } = req.params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
  });

  if (!reservation || reservation.userId !== userId) {
    return res.status(404).json({ error: "Reservation not found" });
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "canceled" },
  });

  res.json(updated);
});

router.patch("/:id/reschedule", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const { id } = req.params;
  const { toTimeSlotId } = req.body;

  if (!toTimeSlotId) {
    return res.status(400).json({ error: "toTimeSlotId is required" });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation || reservation.userId !== userId) {
        throw { status: 404, message: "Reservation not found" };
      }

      const slot = await tx.timeSlot.findUnique({
        where: { id: toTimeSlotId },
        include: {
          reservations: { where: { status: "booked" } },
        },
      });

      if (!slot) {
        throw { status: 404, message: "Target event not found" };
      }

      if (slot.reservations.length >= slot.capacity) {
        throw { status: 409, message: "Target event is full" };
      }

      return tx.reservation.update({
        where: { id },
        data: {
          timeSlotId: toTimeSlotId,
          status: "booked",
        },
      });
    });

    res.json({
      reservationId: updated.id,
      timeSlotId: updated.timeSlotId,
      status: updated.status,
    });
  } catch (err: any) {
    res
      .status(err.status ?? 500)
      .json({ error: err.message ?? "Reschedule failed" });
  }
});



export default router;
