// src/server.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import cors from "cors";

import { openapi } from "./docs/openapi";
import contact from "./routes/contact";
import quote from "./routes/quote";
import auth from "./routes/auth";

const app = express();

// Detrás de Vercel/Proxy
app.set("trust proxy", 1);

/* ------------------------- CORS (robusto) ------------------------- */
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsMw = cors({
  origin(origin, cb) {
    // Permite herramientas sin origin (curl, health checks)
    if (!origin) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
});

// CORS en toda la app + manejo explícito de preflight
app.use(corsMw);
app.options("*", corsMw);

/* ------------------------- App base ------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(helmet());

// ✅ Rate limit correcto: usa ipKeyGenerator y NO afecta preflight
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,          // <- importante en Vercel/IPv6
    skip: (req) => req.method === "OPTIONS" // <- NO contar/ejecutar en preflight
  })
);

/* ------------------------- Rutas API ------------------------- */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use("/api/auth", auth);
app.use("/api/contact", contact);
app.use("/api/quote", quote);

// Swagger
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 JSON solo para /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
