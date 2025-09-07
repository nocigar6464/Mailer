// src/index.ts
import app from "./server";

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API:  http://localhost:${port}`);
  console.log(`Docs: http://localhost:${port}/docs`);
  console.log(`Docs (ruta Vercel): http://localhost:${port}/api/docs`);
});
