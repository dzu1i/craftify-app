import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auditLog } from "./middleware/auditLog";
import { reservationRouter } from "./routes/reservations";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[reservation-svc] ${req.method} ${req.path}`);
  next();
});

// audit
app.use(auditLog("reservation-svc"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "reservation-svc" });
});

app.use("/reservations", reservationRouter);

export { app };
