import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const email = req.user?.email?.toLowerCase();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !admins.includes(email)) {
    return res.status(403).json({ error: "Admin only" });
  }
  return next();
}
