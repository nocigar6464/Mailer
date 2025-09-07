import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { openapi } from "./docs/openapi";
import contact from "./routes/contact";
import quote from "./routes/quote";
import auth from "./routes/auth";

const app = express();

/* ============ CORS con paquete oficial (maneja preflight) ============ */
// Orígenes permitidos (coma-separado)
const ALLOWED = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // Permite llamadas desde orígenes explícitos en ALLOWED
    if (origin && ALLOWED.includes(origin)) return cb(null, true);
    // Permite herramientas sin Origin (curl, uptime, etc.)
    if (!origin) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  optionsSuccessStatus: 204, // OK para navegadores legacy
};

// ¡MUY IMPORTANTE!: montar CORS ANTES que las rutas
// CAMBIO AQUÍ: Eliminado el prefijo "/api". Ahora se aplica a todas las peticiones que lleguen.
app.use(cors(corsOptions));

/* ============ App base ============ */
app.use(express.json({ limit: "1mb" }));
app.use(helmet());

// Para que express-rate-limit compute bien la IP detrás de Vercel/Proxy
app.set("trust proxy", 1);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    // Evita el warning del 'Forwarded' y soporta IPv6 detrás de proxy
    keyGenerator: (req: any) => req.ip,
  })
);

/* ============ Rutas API ============ */
// Health
// CAMBIO AQUÍ: La ruta ahora es "/health" (se accederá vía /api/health)
app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Endpoints
// CAMBIO AQUÍ: Eliminado el prefijo "/api" de todas las rutas.
app.use("/auth", auth);
app.use("/contact", contact);
app.use("/quote", quote);

// Swagger
// CAMBIO AQUÍ: La ruta ahora es "/docs" (se accederá vía /api/docs)
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

// 404 JSON para cualquier ruta no encontrada
// CAMBIO AQUÍ: Este middleware ahora atrapará todo lo que no coincidió antes.
app.use((_req, res) => res.status(404).json({ error: "not_found" }));

export default app;
