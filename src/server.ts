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

/* ------------------------- CORS (robusto) ------------------------- */
/**
 * Permite configurar varios orígenes en CORS_ORIGIN separados por coma.
 * Agrega automáticamente la variante 127.0.0.1 cuando aparece "localhost".
 * Responde a preflights (OPTIONS) con los headers correctos.
 */
const rawAllowed = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set<string>([
  ...rawAllowed,
  ...rawAllowed.map((o) => o.replace("localhost", "127.0.0.1")),
]);

function setCorsHeaders(req: express.Request, res: express.Response) {
  const origin = (req.headers.origin || "") as string;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  // Headers/Methods permitidos (para preflight y para respuestas normales)
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

app.use((req, res, next) => {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    // Preflight: 204 sin cuerpo
    return res.status(204).end();
  }
  next();
});

/* ------------------------- App base ------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(
  helmet({
    // Sin CSP para evitar bloquear assets de Swagger UI (no se habilita por defecto, pero lo dejamos explícito)
    contentSecurityPolicy: false,
  })
);
app.use(
  rateLimit({
    windowMs: 60_000, // 1 min
    max: 60,          // 60 req/min
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* ------------------------- Rutas API ------------------------- */
// Health
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Endpoints principales
app.use("/api/auth", auth);
app.use("/api/contact", contact);
app.use("/api/quote", quote);

// Swagger (sirve la UI en /api/docs)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 para cualquier ruta bajo /api no manejada
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
