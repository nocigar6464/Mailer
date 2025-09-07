import type { QuoteInput } from "../schemas/quote";
import { guessNameFromEmail, looksLikeEmail } from "../utils/name";

const BRAND_PRIMARY = "#0b2f46";
const BRAND_ACCENT  = "#e0b13c";
const BG_SOFT       = "#f5f7fb";
const BORDER        = "#e6eef5";
const TEXT_MUTED    = "#5b6b7a";

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function quoteHtml(data: QuoteInput): string {
  const safeName =
    !data.name || looksLikeEmail(data.name)
      ? (guessNameFromEmail(data.email) || data.name)
      : data.name;

  const rows = data.items
    .map((it) => {
      const total = it.quantity * it.unitPrice;
      return `
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid ${BORDER};">${esc(it.description)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid ${BORDER};" align="center">${it.quantity}</td>
          <td style="padding:10px 12px; border-bottom:1px solid ${BORDER};" align="right">${formatCLP(it.unitPrice)}</td>
          <td style="padding:10px 12px; border-bottom:1px solid ${BORDER};" align="right">${formatCLP(total)}</td>
        </tr>`;
    })
    .join("");

  const subtotal = data.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

  return `
  <!doctype html>
  <html lang="es">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Nueva cotización</title>
    </head>
    <body style="margin:0;background:${BG_SOFT};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1a2b;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:760px;background:#fff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
              <tr>
                <td style="background:${BRAND_PRIMARY};padding:18px 22px;">
                  <div style="color:#fff;font-weight:700;font-size:18px;letter-spacing:.3px;">CanLAB</div>
                  <div style="color:${BRAND_ACCENT};font-weight:700;font-size:22px;margin-top:4px;">Nueva cotización</div>
                </td>
              </tr>

              <tr>
                <td style="padding:22px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;font-size:15px;line-height:1.5;margin-bottom:14px;">
                    <tr>
                      <td style="padding:6px 0; color:${TEXT_MUTED}; width:140px;">Cliente</td>
                      <td style="padding:6px 0; font-weight:600;">${esc(safeName)}</td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:${TEXT_MUTED};">Correo</td>
                      <td style="padding:6px 0;">
                        <a href="mailto:${esc(data.email)}" style="color:${BRAND_PRIMARY};text-decoration:none;">${esc(data.email)}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0; color:${TEXT_MUTED};">Moneda</td>
                      <td style="padding:6px 0; font-weight:600;">${esc(data.currency)}</td>
                    </tr>
                  </table>

                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;">
                    <thead>
                      <tr style="background:${BG_SOFT};">
                        <th align="left"  style="padding:10px 12px;border-bottom:1px solid ${BORDER};font-weight:600;">Descripción</th>
                        <th align="center"style="padding:10px 12px;border-bottom:1px solid ${BORDER};font-weight:600;">Cantidad</th>
                        <th align="right" style="padding:10px 12px;border-bottom:1px solid ${BORDER};font-weight:600;">Precio unit.</th>
                        <th align="right" style="padding:10px 12px;border-bottom:1px solid ${BORDER};font-weight:600;">Importe</th>
                      </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                  </table>

                  <div style="margin-top:12px; text-align:right; font-weight:700;">${formatCLP(subtotal)}</div>

                  ${
                    data.notes
                      ? `<div style="margin-top:18px; color:${TEXT_MUTED}; font-size:13px; text-transform:uppercase; letter-spacing:.6px;">Notas</div>
                         <div style="background:${BG_SOFT};border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;white-space:pre-wrap;font-size:15px;">${esc(
                           data.notes
                         )}</div>`
                      : ""
                  }
                </td>
              </tr>

              <tr>
                <td style="padding:14px 22px;border-top:1px solid ${BORDER}; color:${TEXT_MUTED}; font-size:12px;">
                  Cotización generada desde el formulario web de CanLAB.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
}

export function quoteText(data: QuoteInput): string {
  const safeName =
    !data.name || looksLikeEmail(data.name)
      ? (guessNameFromEmail(data.email) || data.name)
      : data.name;

  const subtotal = data.items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

  return (
`[CanLAB] Nueva cotización
Cliente: ${safeName}
Email:   ${data.email}
Moneda:  ${data.currency}

Items:
${data.items.map(i => `- ${i.description} x ${i.quantity} = ${i.unitPrice}`).join("\n")}

Subtotal: ${subtotal}
${data.notes ? `\nNotas:\n${data.notes}` : ""}`
  );
}
