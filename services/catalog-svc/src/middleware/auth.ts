import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // TODO: Replace with real Supabase JWT decoding
  (req as any).user = {
    id: "demo-user-id",
    email: "demo@example.com",
    isAdmin: true,
  };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user?.isAdmin) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}
