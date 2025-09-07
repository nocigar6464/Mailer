// src/server.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

import { openapi } from "./docs/openapi";
import contact from "./routes/contact";
import quote from "./routes/quote";
import auth from "./routes/auth";

const app = express();

// Estamos detrás de proxy (Vercel/NGINX/etc.)
app.set("trust proxy", 1);

/* ------------------------- CORS (robusto) ------------------------- */
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_SET = new Set(ALLOWED);

const corsMw = cors({
  origin(origin, cb) {
    // Permite herramientas sin origen (curl, health checks, etc.)
    if (!origin) return cb(null, true);
    if (ALLOWED_SET.has(origin)) return cb(null, true);
    // No devolver error 500; solo negar CORS (el navegador bloqueará)
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
});

app.use(corsMw);
app.options("*", corsMw); // Responder todos los preflight OK

/* ------------------------- App base ------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(helmet());

/** IP segura para rate limit (usa Forwarded / X-Forwarded-For si existe) */
function clientIp(req: express.Request): string {
  const fwd = (req.headers["x-forwarded-for"] ||
               req.headers["forwarded"]) as string | undefined;

  if (fwd) {
    // X-Forwarded-For: "client, proxy1, proxy2"
    const first = fwd.split(",")[0]?.trim() || "";
    return first.startsWith("::ffff:") ? first.slice(7) : first;
  }

  const ip = req.ip || req.socket.remoteAddress || "";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

// Rate limit: NO contar/ejecutar en preflight
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => clientIp(req),
    skip: (req) => req.method === "OPTIONS",
    // Por si tu versión valida agresivo y lanza warnings:
    validate: false,
  })
);

/* ------------------------- Rutas API ------------------------- */
// Health
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Endpoints
app.use("/api/auth", auth);
app.use("/api/contact", contact);
app.use("/api/quote", quote);

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 JSON solo para /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
