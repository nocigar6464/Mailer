// src/templates/contact.ts
import type { ContactInput } from "../schemas/contact";

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

export function contactHtml(data: ContactInput): string {
  const phoneRow = data.phone
    ? `
      <tr>
        <td style="padding:8px 0; color:${TEXT_MUTED}; width:140px;">Teléfono</td>
        <td style="padding:8px 0; font-weight:600;">${esc(data.phone)}</td>
      </tr>`
    : "";

  return `
  <!doctype html>
  <html lang="es">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Nuevo contacto</title>
    </head>
    <body style="margin:0;background:${BG_SOFT};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1a2b;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#fff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:${BRAND_PRIMARY};padding:18px 22px;">
                  <div style="color:#fff;font-weight:700;font-size:18px;letter-spacing:.3px;">CanLAB</div>
                  <div style="color:${BRAND_ACCENT};font-weight:700;font-size:22px;margin-top:4px;">Nuevo contacto</div>
                </td>
              </tr>

              <tr>
                <td style="padding:22px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;font-size:15px;line-height:1.5;">
                    <tr>
                      <td style="padding:8px 0; color:${TEXT_MUTED}; width:140px;">Nombre</td>
                      <td style="padding:8px 0; font-weight:600;">${esc(data.name)}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0; color:${TEXT_MUTED};">Email</td>
                      <td style="padding:8px 0; font-weight:600;">${esc(data.email)}</td>
                    </tr>
                    ${phoneRow}
                  </table>

                  <div style="margin:18px 0 6px; color:${TEXT_MUTED}; font-size:13px; text-transform:uppercase; letter-spacing:.6px;">Mensaje</div>
                  <div style="background:${BG_SOFT};border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;white-space:pre-wrap;font-size:15px;">
                    ${esc(data.message || "")}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:14px 22px;border-top:1px solid ${BORDER}; color:${TEXT_MUTED}; font-size:12px;">
                  Recibiste este correo porque alguien envió el formulario de contacto en CanLAB.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export function contactText(data: ContactInput): string {
  const phoneLine = data.phone ? `Teléfono: ${data.phone}\n` : "";
  return (
`[CanLAB] Nuevo contacto
Nombre: ${data.name}
Email: ${data.email}
${phoneLine}Mensaje:
${data.message}`
  );
}
