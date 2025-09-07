// src/server.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// 👇 usa require para evitar problemas de default import con @vercel/node
//    (en TS compila bien aunque tengas "type":"commonjs")
const cors = require("cors") as typeof import("cors");

import swaggerUi from "swagger-ui-express";
import { openapi } from "./docs/openapi";
import contact from "./routes/contact";
import quote from "./routes/quote";
import auth from "./routes/auth";

const app = express();

/* ------------------------- CORS robusto ------------------------- */
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: import("cors").CorsOptions = {
  origin(origin, cb) {
    // same-origin / herramientas (no traen Origin)
    if (!origin) return cb(null, true);
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
app.options("*", cors(corsOptions)); // preflight global

/* ------------------------- Middlewares base ------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* ------------------------- Rutas API ------------------------- */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() }),
);

app.use("/api/auth", auth);
app.use("/api/contact", contact);
app.use("/api/quote", quote);

// Swagger dentro de /api
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 JSON sólo para /api/*
app.use("/api", (_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
