import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type AuthUser = {
  id: string; // Supabase user id (JWT "sub")
  email?: string;
  payload: JWTPayload;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization ?? "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

const supabaseUrlRaw = process.env.SUPABASE_URL;
if (!supabaseUrlRaw) {
  throw new Error("Missing SUPABASE_URL env var");
}

// IMPORTANT: normalize trailing slash
const supabaseUrl = supabaseUrlRaw.replace(/\/$/, "");

// Supabase JWKS endpoint
const jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/keys`));

const audience = process.env.SUPABASE_JWT_AUD ?? "authenticated";
const issuer = `${supabaseUrl}/auth/v1`;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization Bearer token" });
    }

    const { payload } = await jwtVerify(token, jwks, {
      audience,
      issuer,
    });

    if (!payload.sub) {
      return res.status(401).json({ error: "Invalid token (missing sub)" });
    }

    req.user = {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      payload,
    };

    return next();
  } catch (err) {
    // show real reason in terminal
    console.error("[auth] Invalid token:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}