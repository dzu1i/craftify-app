import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export type AuthUser = {
  sub: string;
  email?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const token = header.slice("Bearer ".length);
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "SUPABASE_JWT_SECRET not set" });
  }

  try {
    const payload = jwt.verify(token, secret) as any;
    req.user = { sub: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
