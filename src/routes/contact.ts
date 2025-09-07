import { Router } from "express";
import { contactSchema } from "../schemas/contact";
import { sendEmail } from "../services/email";
import { contactHtml, contactText } from "../templates/contact";
import { verifyRecaptcha } from "../services/captcha";

const router = Router();

router.post("/", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_payload", issues: parsed.error.format() });
  }

  const ip =
    (req.headers["x-real-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string) ||
    undefined;

  // si lo mandas desde el front, vendrá aquí; si no, el servicio puede
  // usar DEV_BYPASS_CAPTCHA=true en .env para desarrollo
  const token = parsed.data.recaptchaToken;

  const ok = await verifyRecaptcha(token, ip);
  if (!ok) return res.status(400).json({ error: "captcha_failed" });

  await sendEmail({
    subject: `Nuevo contacto: ${parsed.data.name}`,
    html: contactHtml(parsed.data), 
    text: contactText(parsed.data),
    replyTo: parsed.data.email,
  });

  res.json({ ok: true });
});

export default router;
