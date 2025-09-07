import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/server";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  
  try {
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (err?: any) => {
        if (err) {
          console.error('Express error:', err);
          return reject(err);
        }
        resolve(void 0);
      });
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
