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

/* ------------------------- CORS ------------------------- */
// Permite coma-separado, sin espacios extra.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = (req.headers.origin as string) || "";

  // Si el origen está permitido, refleja ese origen y permite credenciales
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  // Para peticiones normales expón/acepta cabeceras comunes
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  // Para OPTIONS (preflight) responde 204 y **refleja** lo que pide el navegador
  if (req.method === "OPTIONS") {
    const reqHeaders =
      (req.headers["access-control-request-headers"] as string) || "content-type";
    const reqMethod =
      (req.headers["access-control-request-method"] as string) || "POST";

    res.setHeader("Access-Control-Allow-Headers", reqHeaders);
    res.setHeader("Access-Control-Allow-Methods", reqMethod);
    return res.status(204).end();
  }

  next();
});

/* ------------------------- App base ------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
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

// Swagger bajo /api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 API
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
