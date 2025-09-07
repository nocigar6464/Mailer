// src/templates/auth.ts
const BRAND_PRIMARY = "#0b2f46"; 
const BRAND_ACCENT  = "#e0b13c"; 
const BG_SOFT       = "#f5f7fb";
const BORDER        = "#e6eef5";
const TEXT_MUTED    = "#5b6b7a";

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function magicLinkHtml(params: {
  link: string; email: string; minutes?: number; devNote?: string | undefined;
}) {
  const { link, email, minutes = 10, devNote } = params;

  const devBox = devNote
    ? `<div style="margin-top:14px;padding:10px 12px;background:${BG_SOFT};border:1px dashed ${BORDER};border-radius:8px;color:${TEXT_MUTED};font-size:13px;">
         ${esc(devNote)}
       </div>`
    : "";

  return `<!doctype html>
  <html lang="es">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Acceso a CanLAB</title>
  </head>
  <body style="margin:0;background:${BG_SOFT};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1a2b;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#fff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${BRAND_PRIMARY};padding:18px 22px;">
                <div style="color:#fff;font-weight:700;font-size:18px;letter-spacing:.3px;">CanLAB</div>
                <div style="color:${BRAND_ACCENT};font-weight:700;font-size:22px;margin-top:4px;">Acceso con un click</div>
              </td>
            </tr>

            <tr>
              <td style="padding:22px;font-size:15px;line-height:1.55;">
                <p>Hola,</p>
                <p>Para entrar a tu propuesta usa este botón. El enlace vence en <strong>${minutes} minutos</strong>.</p>

                <div style="margin:18px 0;">
                  <a href="${link}" style="display:inline-block;background:${BRAND_ACCENT};color:${BRAND_PRIMARY};text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">
                    Abrir mi propuesta
                  </a>
                </div>

                <div style="margin-top:14px;color:${TEXT_MUTED};font-size:13px;">Correo: <strong>${esc(email)}</strong></div>

                <div style="margin-top:18px;color:${TEXT_MUTED};font-size:13px;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="${link}" style="color:${BRAND_PRIMARY};text-decoration:underline;">${link}</a>
                </div>

                ${devBox}
              </td>
            </tr>

            <tr>
              <td style="padding:14px 22px;border-top:1px solid ${BORDER}; color:${TEXT_MUTED}; font-size:12px;">
                Recibiste este correo porque solicitaste un enlace de acceso en CanLAB.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}


export function magicLinkText(params: {
  link: string; email: string; minutes?: number; devNote?: string | undefined;
}) {
  const { link, email, minutes = 10, devNote } = params;
  const extra = devNote ? `\n\n[Dev] ${devNote}` : "";
  return (
`[CanLAB] Acceso con un click
Correo: ${email}
Este enlace vence en ${minutes} minutos.

${link}${extra}`
  );
}
