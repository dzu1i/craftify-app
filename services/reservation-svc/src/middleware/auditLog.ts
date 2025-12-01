import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export function auditLog(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", async () => {
      try {
        const mutating = ["POST", "PATCH", "DELETE"].includes(req.method);
        if (!mutating) return;

        await prisma.auditLog.create({
          data: {
            service: serviceName,
            userId: (req as any).user?.id ?? null,
            action: `${req.method} ${req.path}`,
            entityType: (req as any).auditEntityType ?? null,
            entityId: (req as any).auditEntityId ?? null,
            payload: (req as any).auditPayload ?? null,
            ip: req.ip,
            userAgent: req.headers["user-agent"] ?? null,
          },
        });
      } catch (err) {
        console.error("Audit log error:", err);
      }
    });
    next();
  };
}
