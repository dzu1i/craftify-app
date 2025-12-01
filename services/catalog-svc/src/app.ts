import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auditLog } from "./middleware/auditLog";
import { requireAuth } from "./middleware/auth";
import { eventRouter } from "./routes/events";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[catalog-svc] ${req.method} ${req.path}`);
  next();
});

// Attach fake auth (to be replaced with Supabase)
app.use(requireAuth);

// Audit middleware
app.use(auditLog("catalog-svc"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "catalog-svc" });
});

app.use("/events", eventRouter);

export { app };
