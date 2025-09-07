import { Router } from "express";
import { quoteSchema } from "../schemas/quote";
import { sendEmail } from "../services/email";
import { quoteHtml, quoteText } from "../templates/quote";
import { verifyRecaptcha } from "../services/captcha";
import { guessNameFromEmail, looksLikeEmail } from "../utils/name";

const router = Router();

router.post("/", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "invalid_payload", issues: parsed.error.format() });
  }

  const ip =
    (req.headers["x-real-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string) ||
    undefined;
  const token =
    (req.body?.recaptchaToken as string | undefined) ?? undefined;
  const ok = await verifyRecaptcha(token, ip);
  if (!ok) return res.status(400).json({ error: "captcha_failed" });

  const { name, email } = parsed.data;
  const inferred =
    (!name || looksLikeEmail(name)) ? (guessNameFromEmail(email) || name) : name;

  const payload = { ...parsed.data, name: inferred };

  await sendEmail({
    subject: `Nueva cotización: ${payload.name}`,
    html: quoteHtml(payload),
    text: quoteText(payload),
    replyTo: payload.email,
  });

  res.json({ ok: true });
});

export default router;
