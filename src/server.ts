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

/* ------------------------- CORS (robusto) ------------------------- */
// Orígenes permitidos (coma-separados). Ej:
// CORS_ORIGIN=http://localhost:5173,https://canlab.cl,https://*.tu-dominio.com
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsMw = cors({
  origin(origin, cb) {
    // peticiones same-origin o herramientas (no traen Origin)
    if (!origin) return cb(null, true);
    // matcheo exacto
    if (ALLOWED.includes(origin)) return cb(null, true);
    // si usas subdominios, puedes relajar aquí con una RegExp si quieres
    return cb(new Error(`CORS: origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
});

// Aplica CORS a todo y asegura OPTIONS global (preflight)
app.use(corsMw);
app.options("*", corsMw);

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

// Swagger dentro de /api para que funcione en Vercel
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 JSON solo para rutas /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;

