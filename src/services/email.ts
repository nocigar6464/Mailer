import { Resend } from "resend";

const hasResend = Boolean(process.env.RESEND_API_KEY);
const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

// Admins por defecto (para Contacto/Cotizador)
const toAdmin = (process.env.RESEND_TO ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// (opcional) BCC global
const bccEnv = (process.env.RESEND_BCC ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

function asList(x?: string | string[]): string[] {
  if (!x) return [];
  return Array.isArray(x) ? x.filter(Boolean) : [x].filter(Boolean);
}

export async function sendEmail(params: {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
}) {
  const to = asList(params.to);
  const finalTo = to.length ? to : toAdmin;

  const cc = asList(params.cc);
  const bcc = [...bccEnv, ...asList(params.bcc)];

  if (!hasResend) {
    console.log("[MOCK EMAIL]", {
      from,
      to: finalTo.length ? finalTo : ["delivered@resend.dev"],
      cc,
      bcc,
      subject: params.subject,
      replyTo: params.replyTo,
      htmlLen: params.html?.length ?? 0,
      textLen: params.text?.length ?? 0,
    });
    return { id: "mock-id" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const payload: Record<string, unknown> = {
    from,
    to: finalTo.length ? finalTo : ["delivered@resend.dev"],
    subject: params.subject,
    html: params.html,
  };
  if (params.text !== undefined) payload.text = params.text;
  if (params.replyTo) payload.replyTo = params.replyTo;
  if (cc.length) payload.cc = cc;
  if (bcc.length) payload.bcc = bcc;

  const { data, error } = await resend.emails.send(payload as any);

  if (error) {
    console.error("[RESEND ERROR]", {
      error,
      payload,
    });
    const msg =
      typeof error === "string"
        ? error
        : (error as any)?.message ||
          (error as any)?.name ||
          JSON.stringify(error);
    throw new Error(`Resend error: ${msg}`);
  }

  return data;
}
