import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const reservationRouter = Router();

// Auth required for all
reservationRouter.use(requireAuth);

/**
 * POST /reservations
 */
reservationRouter.post("/", async (req, res) => {
  const { eventId } = req.body;
  const user = (req as any).user;

  if (!eventId) return res.status(400).json({ error: "eventId required" });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.status !== "published")
    return res.status(400).json({ error: "Unavailable event" });

  const count = await prisma.booking.count({
    where: { eventId, status: "confirmed" },
  });

  if (count >= event.capacity)
    return res.status(409).json({ error: "Event full" });

  const booking = await prisma.booking.create({
    data: { eventId, customerId: user.id },
  });

  (req as any).auditEntityType = "Booking";
  (req as any).auditEntityId = booking.id;
  (req as any).auditPayload = req.body;

  res.status(201).json(booking);
});

/**
 * GET /reservations/me
 */
reservationRouter.get("/me", async (req, res) => {
  const user = (req as any).user;

  const bookings = await prisma.booking.findMany({
    where: { customerId: user.id },
    include: {
      event: {
        include: { location: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(bookings);
});

/**
 * PATCH /reservations/:id/cancel
 */
reservationRouter.patch("/:id/cancel", async (req, res) => {
  const user = (req as any).user;
  const id = req.params.id;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.customerId !== user.id)
    return res.status(404).json({ error: "Not found" });

  if (booking.status === "cancelled") return res.json(booking);

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  (req as any).auditEntityType = "Booking";
  (req as any).auditEntityId = updated.id;
  (req as any).auditPayload = { cancelled: true };

  res.json(updated);
});
