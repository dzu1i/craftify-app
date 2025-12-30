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

// normalize: remove trailing slash
const supabaseUrl = supabaseUrlRaw.replace(/\/$/, "");

// Optional (only used in fallback verification)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const audience = process.env.SUPABASE_JWT_AUD ?? "authenticated";
const issuer = `${supabaseUrl}/auth/v1`;

// Supabase JWKS endpoint
const jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/keys`));

async function verifyViaSupabaseUserinfo(token: string): Promise<{ sub: string; email?: string }> {
  if (!supabaseAnonKey) {
    throw new Error("Missing SUPABASE_ANON_KEY env var (needed for Supabase verify fallback)");
  }

  const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Supabase /auth/v1/user failed: ${r.status} ${text}`);
  }

  const data = (await r.json()) as { id?: string; email?: string };
  if (!data.id) throw new Error("Supabase /auth/v1/user returned no id");
  return { sub: data.id, email: data.email };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing Authorization Bearer token" });
    }

    // 1) Primary: local JWT verification via JWKS
    try {
      const { payload } = await jwtVerify(token, jwks, { audience, issuer });

      if (!payload.sub) {
        return res.status(401).json({ error: "Invalid token (missing sub)" });
      }

      req.user = {
        id: payload.sub,
        email: typeof payload.email === "string" ? payload.email : undefined,
        payload,
      };

      return next();
    } catch (e) {
      // 2) Fallback: verify token by calling Supabase (needs apikey)
      // This also helps diagnose issues when JWKS/issuer/aud mismatch.
      const info = await verifyViaSupabaseUserinfo(token);

      // Minimal payload when using fallback (you can enrich if needed)
      req.user = {
        id: info.sub,
        email: info.email,
        payload: { sub: info.sub, email: info.email } as JWTPayload,
      };

      return next();
    }
  } catch (err) {
    // IMPORTANT: log real reason for debugging
    console.error("[auth] requireAuth failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}