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
// Orígenes permitidos (coma-separado)
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Middleware CORS + preflight sin wildcards (evita error path-to-regexp)
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;

  if (origin && ALLOWED.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  // Opcional, por si el front necesita leer Set-Cookie u otros:
  // res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");

  if (req.method === "OPTIONS") {
    // Responder preflight aquí con los headers ya seteados
    return res.status(204).end();
  }
  next();
});

/* ============ App base ============ */
app.use(express.json({ limit: "1mb" }));
app.use(helmet());

// Para que rate-limit use el IP correcto detrás de Vercel/Proxy
app.set("trust proxy", 1);

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => req.ip, // elimina el warning de Forwarded
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

// 404 JSON solo para /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
