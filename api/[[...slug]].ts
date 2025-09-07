import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log para debug (quítalo después)
  console.log(`${req.method} ${req.url}`);
  
  // Asegurarse de que Express maneje la petición correctamente
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err?: any) => {
      if (err) {
        console.error('Express error:', err);
        return reject(err);
      }
      resolve(void 0);
    });
  });
}
