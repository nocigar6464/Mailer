// api/[[...slug]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/server";

// Reutiliza la app de Express para cualquier ruta /api/**
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express es compatible con los req/res de Vercel
  return app(req as any, res as any);
}
