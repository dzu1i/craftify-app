import { Request, Response, NextFunction } from "express";

export default function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // dočasně pustíme všechny (auth doladíme později)
  next();
}
