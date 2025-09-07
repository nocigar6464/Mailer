// src/server.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { openapi } from "./docs/openapi";
import contact from "./routes/contact";
import quote from "./routes/quote";
import auth from "./routes/auth";

const app = express();

/* ============ CORS manual (Express 5 safe) ============ */
// Orígenes permitidos (coma-separado). Ej: "http://localhost:5173,https://tu-dominio.com"
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function setCorsHeaders(req: express.Request, res: express.Response) {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    // añade aquí si usas otros headers personalizados
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  // cachea el preflight
  res.setHeader("Access-Control-Max-Age", "600");
}

// Middleware global CORS + manejo general de OPTIONS
app.use((req, res, next) => {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// **Manejadores OPTIONS explícitos para rutas “sensibles”**
// (algunos hosts/proxies son mañosos con OPTIONS dinámicos)
app.options("/api/auth/request-link", (req, res) => {
  setCorsHeaders(req, res);
  res.status(204).end();
});
app.options("/api/contact", (req, res) => {
  setCorsHeaders(req, res);
  res.status(204).end();
});
app.options("/api/quote", (req, res) => {
  setCorsHeaders(req, res);
  res.status(204).end();
});

/* ============ App base ============ */
app.use(express.json({ limit: "1mb" }));

// Helmet sin políticas que puedan bloquear recursos cross-origin
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Detrás de Vercel/Proxy usa la IP correcta
app.set("trust proxy", 1);

// Evita afectar preflights y usa la IP real (silencia el warning de Forwarded)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => req.ip,
    skip: (req) => req.method === "OPTIONS",
  })
);

/* ============ Rutas API ============ */
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

/* 404 JSON solo bajo /api */
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
