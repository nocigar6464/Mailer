// src/server.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
const cors = require("cors") as typeof import("cors"); // evita default-import issues en Vercel

import swaggerUi from "swagger-ui-express";
import { openapi } from "./docs/openapi";
import contact from "./routes/contact";
import quote from "./routes/quote";
import auth from "./routes/auth";

const app = express();

/* ------------------------- CORS ------------------------- */
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions: import("cors").CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);              // same-origin/tools
    if (ALLOWED.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS not allowed: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
};

app.use(cors(corsOptions));
// ❌ NO usar app.options("*", ...) en Express 5
// ✅ Preflight simple y compatible:
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(204);
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
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use("/api/auth", auth);
app.use("/api/contact", contact);
app.use("/api/quote", quote);

// Swagger en /api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 JSON sólo para /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
