import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/email";
import { serialize, parse } from "cookie";
import { magicLinkHtml, magicLinkText } from "../templates/auth";

const router = Router();

const FRONT_URL  = process.env.FRONT_URL  ?? "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const TEST_RECIPIENT = process.env.RESEND_TEST_RECIPIENT;
const IS_PROD = process.env.NODE_ENV === "production";

/** Setea el cookie de sesión (JWT) */
function setAuthCookie(res: Response, payload: object) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.setHeader(
    "Set-Cookie",
    serialize("canlab_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })
  );
}

/** POST /api/auth/request-link */
router.post("/request-link", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "invalid_email" });
  }

  // Token corto para el link
  const magic = jwt.sign({ email, t: "login" }, JWT_SECRET, { expiresIn: "10m" });
  const link  = `${FRONT_URL}/auth/callback?token=${encodeURIComponent(magic)}`;
  const finalTo = !IS_PROD && TEST_RECIPIENT ? TEST_RECIPIENT : email;
  const devNote = !IS_PROD && TEST_RECIPIENT
    ? `En desarrollo el correo se envió a ${finalTo} (original: ${email}).`
    : undefined;

  await sendEmail({
    to: finalTo,
    subject: "Acceso a CanLAB",
    html: magicLinkHtml({ link, email, minutes: 10, devNote }),
    text: magicLinkText({ link, email, minutes: 10, devNote }),
  });

  return res.json({ ok: true, sentTo: finalTo });
});

/** GET /api/auth/verify?token=... */
router.get("/verify", async (req, res) => {
  try {
    const raw = req.query.token as string | string[] | undefined;
    const token = Array.isArray(raw) ? raw[0] : raw;

    if (!token || typeof token !== "string" || token.length < 20) {
      console.error("[auth][verify] missing/short token:", raw);
      return res.status(400).send("Invalid or expired token");
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as {
      email: string; t: "login"; iat: number; exp: number;
    };
    if (decoded.t !== "login") {
      console.error("[auth][verify] bad type:", decoded);
      return res.status(400).send("Invalid or expired token");
    }

    setAuthCookie(res, { email: decoded.email, role: "user" });
    return res.redirect(302, `${FRONT_URL}/proposal`);
  } catch (err) {
    console.error("[auth][verify] token error:", err);
    return res.status(400).send("Invalid or expired token");
  }
});

/** Estado de autenticación basado en cookie */
router.get("/status", (req, res) => {
  const cookies = parse(req.headers.cookie ?? "");
  const tok = cookies["canlab_auth"];
  if (!tok) return res.json({ authenticated: false });
  try {
    const decoded = jwt.verify(tok, JWT_SECRET);
    return res.json({ authenticated: true, user: decoded });
  } catch {
    return res.json({ authenticated: false });
  }
});

/** Logout */
router.post("/logout", (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    serialize("canlab_auth", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    })
  );
  res.json({ ok: true });
});

export default router;
