# CanLAB Form Mailer (Backend)

API ligera en Node.js/Express para **contacto**, **cotizaciones** y **login por enlace mágico** (passwordless).
Incluye validación con **Zod**, **rate‑limit**, **cookies httpOnly** con **JWT**, y **plantillas HTML** para correos vía **Resend**. Documentación OpenAPI disponible en `/docs`.

---

## Requisitos

- Node.js 18+
- Cuenta en [Resend](https://resend.com/) (o proveedor SMTP propio si adaptas `services/email.ts`)
- (Opcional) **reCAPTCHA v3** si quieres protección en formularios públicos

---

## Instalación

```bash
npm install
```

Copia el ejemplo de variables y ajusta valores:

```bash
cp .env .env.local
```

> En Vercel/entorno cloud define las mismas variables como **Environment Variables**.

### Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto local (p.ej. `3000`) |
| `CORS_ORIGIN` | Orígenes permitidos separados por coma (p.ej. `http://localhost:5173,https://canlab.cl`) |
| `RESEND_API_KEY` | API key de Resend |
| `RESEND_FROM` | Remitente por defecto, ej: `no-reply@tu-dominio.cl` |
| `RESEND_TEST_RECIPIENT` | (Dev) Si se define, los correos se envían aquí en vez del destinatario real |
| `DEV_BYPASS_CAPTCHA` | `true` para omitir captcha en local |
| `RECAPTCHA_SECRET_KEY` | (Prod) Clave secreta de reCAPTCHA v3 |
| `JWT_SECRET` | Secreto largo/aleatorio para firmar JWT |
| `FRONT_URL` | URL pública del front (ej. `http://localhost:5173` o `https://canlab.cl`) |
| `CAPTCHA_PROVIDER` | `recaptcha` (por ahora) |

Ejemplo de `.env` mínimo para desarrollo:

```env
PORT=3000
CORS_ORIGIN=http://localhost:5173
RESEND_API_KEY=tu_resend_key
RESEND_FROM=no-reply@tu-dominio.cl
RESEND_TEST_RECIPIENT=dev@tu-dominio.cl
DEV_BYPASS_CAPTCHA=true
JWT_SECRET=un_secreto_fuerte_y_complejo
FRONT_URL=http://localhost:5173
CAPTCHA_PROVIDER=recaptcha
```

---

## Scripts

```bash
# desarrollo (TS con tsx)
npm run dev

# build a JS (dist/)
npm run build

# ejecutar build
npm start
```

---

## Endpoints

### Health

- `GET /api/health` → `{ ok: true, ts: ISODate }`

### Auth (login por enlace)

- `POST /api/auth/request-link`  
  Body: `{ "email": string, "recaptchaToken"?: string }`  
  Envía un email con enlace a `FRONT_URL/auth/callback?token=...`
- `GET /api/auth/verify?token=...`  
  Verifica token, setea cookie **httpOnly** `canlab_auth` y redirige a `FRONT_URL/proposal`.
- `GET /api/auth/status` → `{ authenticated: boolean, user?: { email, role, iat, exp } }`
- `POST /api/auth/logout` → borra cookie.

### Contacto

- `POST /api/contact`  
  **Body (JSON)**:

  ```json
  {
    "name": "string (>=2)",
    "email": "email",
    "phone": "string (opcional)",
    "message": "string (50..5000)",
    "recaptchaToken": "string (opcional en dev)"
  }
  ```

  Respuesta: `{ ok: true }`

### Cotización

- `POST /api/quote`  
  **Body (JSON)**:

  ```json
  {
    "name": "string",
    "email": "email",
    "currency": "CLP | USD",
    "items": [
      { "description": "string", "quantity": 1, "unitPrice": 1200000 }
    ],
    "includeVAT": false,
    "notes": "string (opcional)"
  }
  ```

  Respuesta: `{ ok: true }`

### Documentación

- `GET /docs` → Swagger UI (OpenAPI 3.1).

---

## CORS

Se configura en `src/index.ts`. Define `CORS_ORIGIN` con una o varias URLs separadas por coma.  
Ejemplo prod:  
`CORS_ORIGIN=https://canlab.cl,https://www.canlab.cl`

---

## Seguridad

- Cookies `httpOnly`, `sameSite=lax`, `secure` en producción.
- JWT firmado con `HS256` y expiración razonable.
- `helmet` con cabeceras seguras.
- `express-rate-limit` (60 req/min por IP, ajustable).
- Validación **Zod** en cada payload.
- Captcha opcional (habilítalo en prod).

---

## Estructura

```
src/
  docs/          # openapi
  routes/        # auth, contact, quote
  schemas/       # zod schemas
  services/      # captcha, email
  templates/     # plantillas HTML/text (auth/contact/quote)
  utils/         # helpers (names, server wrapper)
  index.ts       # bootstrap express
api/
  index.ts       # (Vercel) reusa la misma app express
```

---

## Notas de integración Frontend

- El **login** espera que el front tenga una ruta `/auth/callback` que haga `window.location.replace(API_URL + "/api/auth/verify?token=...")`. El backend setea cookie y redirige a `/proposal`.
- Usa `credentials: "include"` en fetch para enviar cookies.
- Enviar `wizardData` al `sessionStorage` antes de redirigir a `/login`, y en `/proposal` leerlo en caso de no tener `state` del router.

---

## Solución de problemas

- **CORS**: revisa `CORS_ORIGIN` coincide exactamente con el `origin` del navegador.
- **Cookies no llegan**: en prod necesitas `https` y `secure: true` para `Set-Cookie`.
- **Correos no salen**: verifica dominio y registros en Resend (SPF/DKIM). Usa los logs de Resend.
- **Captcha falla en prod**: asegúrate de pasar `recaptchaToken` y usar la secret `RECAPTCHA_SECRET_KEY` correcta.

---

## Licencia

MIT
