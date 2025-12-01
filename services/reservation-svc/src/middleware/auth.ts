import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // TODO: Replace with real Supabase auth
  (req as any).user = {
    id: "demo-user-id",
    email: "demo@example.com",
    isAdmin: false,
  };
  next();
}
