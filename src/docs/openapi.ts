// src/docs/openapi.ts
export const openapi = {
  openapi: "3.1.0",
  info: {
    title: "CanLAB – Form Mailer API",
    version: "1.0.0",
    description:
      "API para formularios de **contacto**, **cotización** y **acceso por enlace** (magic link).\n\n" +
      "- Respuestas JSON por defecto.\n" +
      "- CORS permitido sólo para orígenes configurados.\n" +
      "- Rate limit: **60 req/min** (429 cuando se alcanza el límite).\n" +
      "- Autenticación por **cookie httpOnly** (setado en `/api/auth/verify`).",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "health", description: "Estado del servicio" },
    { name: "contact", description: "Formulario de contacto" },
    { name: "quote", description: "Envío de cotizaciones" },
    { name: "auth", description: "Acceso por enlace (magic link)" },
  ],

  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
        required: ["error"],
        examples: [{ error: "invalid_payload" }],
      },
      OkResponse: {
        type: "object",
        properties: { ok: { type: "boolean", const: true } },
        required: ["ok"],
        example: { ok: true },
      },

      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", const: true },
          ts: { type: "string", format: "date-time" },
        },
        required: ["ok", "ts"],
        example: { ok: true, ts: "2025-09-03T19:17:41.123Z" },
      },

      ContactRequest: {
        type: "object",
        required: ["name", "email", "message"],
        properties: {
          name: { type: "string", minLength: 2 },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          message: { type: "string", minLength: 50, maxLength: 5000 },
          recaptchaToken: { type: "string", description: "Opcional en dev." },
        },
        example: {
          name: "Jane Doe",
          email: "contact@example.com",
          phone: "+56 9 1234 5678",
          message:
            "Hola, me interesa fabricar un cóctel en lata. Necesito 2.000 unidades 350 ml. ¿Podemos coordinar una reunión técnica?",
          recaptchaToken: "03AFcWeA....",
        },
      },

      QuoteItem: {
        type: "object",
        required: ["description", "quantity", "unitPrice"],
        properties: {
          description: { type: "string", minLength: 2 },
          quantity: { type: "number", minimum: 1 },
          unitPrice: { type: "number", minimum: 0 },
        },
        example: {
          description: "Producción Cerveza — IPA",
          quantity: 1,
          unitPrice: 1045000,
        },
      },
      QuoteRequest: {
        type: "object",
        required: ["name", "email", "items"],
        properties: {
          name: { type: "string", minLength: 2 },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          currency: { type: "string", enum: ["CLP", "USD"], default: "CLP" },
          includeVAT: { type: "boolean", default: false },
          notes: { type: "string" },
          items: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/QuoteItem" },
          },
        },
        example: {
          name: "user@example.com",
          email: "user@example.com",
          currency: "CLP",
          items: [
            {
              description: "Producción Cócteles — Pisco Sour 473 ml",
              quantity: 1,
              unitPrice: 1140000,
            },
          ],
          notes: "Plan: transfer. Cantidad: 5000.",
        },
      },

      MagicLinkRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
          recaptchaToken: { type: "string", description: "Opcional en dev." },
        },
        example: { email: "user@example.com", recaptchaToken: "03AFcWeA...." },
      },
      MagicLinkResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", const: true },
          sentTo: {
            type: "string",
            description:
              "Correo de destino (en dev puede ser el sandbox de tu proveedor).",
          },
        },
        required: ["ok"],
        example: { ok: true, sentTo: "sandbox@example.com" },
      },
      AuthStatusResponse: {
        type: "object",
        properties: {
          authenticated: { type: "boolean" },
          user: {
            type: "object",
            nullable: true,
            properties: {
              email: { type: "string", format: "email" },
              role: { type: "string" },
              iat: { type: "number" },
              exp: { type: "number" },
            },
          },
        },
        required: ["authenticated"],
        example: {
          authenticated: true,
          user: {
            email: "user@example.com",
            role: "user",
            iat: 1757593100,
            exp: 1758197900,
          },
        },
      },
    },

    responses: {
      TooManyRequests: {
        description: "Demasiadas solicitudes (rate limit: 60/min).",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { error: "rate_limited" },
          },
        },
      },
      BadRequest: {
        description: "Solicitud inválida.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            examples: {
              invalid_payload: { value: { error: "invalid_payload" } },
              invalid_email: { value: { error: "invalid_email" } },
              captcha_failed: { value: { error: "captcha_failed" } },
            },
          },
        },
      },
    },

    headers: {
      SetCookieAuth: {
        description:
          "Cookie de sesión httpOnly. En prod incluye `Secure` y `SameSite=Lax`.",
        schema: { type: "string" },
        example:
          "canlab_auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Lax",
      },
      LocationProposal: {
        description: "URL adonde se redirige tras verificar el token.",
        schema: { type: "string", format: "uri" },
        example: "http://localhost:5173/proposal",
      },
    },
  },

  paths: {
    "/api/health": {
      get: {
        tags: ["health"],
        summary: "Healthcheck",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },

    "/api/contact": {
      post: {
        tags: ["contact"],
        summary: "Enviar contacto",
        description:
          "Crea un ticket de contacto y envía un correo al equipo. En desarrollo el reCAPTCHA puede no ser obligatorio.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ContactRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Contacto enviado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkResponse" },
                example: { ok: true },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },

    "/api/quote": {
      post: {
        tags: ["quote"],
        summary: "Enviar cotización",
        description:
          "Genera un correo con la cotización. El *cliente* se toma desde el `name`/`email` que envíes.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/QuoteRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Cotización enviada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkResponse" },
                example: { ok: true },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },

    "/api/auth/request-link": {
      post: {
        tags: ["auth"],
        summary: "Solicitar enlace de acceso (magic link)",
        description:
          "Envía un correo con un enlace válido por **10 minutos**. En desarrollo, si está configurado un sandbox, el mail puede enviarse al correo sandbox.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MagicLinkRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Enlace enviado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MagicLinkResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "429": { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },

    "/api/auth/verify": {
      get: {
        tags: ["auth"],
        summary: "Verificar token (redirección con cookie)",
        description:
          "Valida el token del enlace y **setea la cookie httpOnly** (`canlab_auth`). Luego **redirecciona** a la SPA (`/proposal`).",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string", minLength: 20 },
            description: "Token firmado (JWT) recibido en el correo.",
          },
        ],
        responses: {
          "302": {
            description:
              "Redirección a la SPA. Se setea el cookie de sesión.",
            headers: {
              "Set-Cookie": { $ref: "#/components/headers/SetCookieAuth" },
              Location: { $ref: "#/components/headers/LocationProposal" },
            },
          },
          "400": {
            description: "Token inválido o expirado.",
            content: {
              "text/plain": { schema: { type: "string" }, example: "Invalid or expired token" },
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "invalid_token" },
              },
            },
          },
        },
      },
    },

    "/api/auth/status": {
      get: {
        tags: ["auth"],
        summary: "Estado de autenticación (por cookie)",
        responses: {
          "200": {
            description: "Estado actual",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthStatusResponse" },
              },
            },
          },
        },
      },
    },

    "/api/auth/logout": {
      post: {
        tags: ["auth"],
        summary: "Cerrar sesión (borra cookie)",
        responses: {
          "200": {
            description: "Sesión finalizada; cookie eliminada",
            headers: {
              "Set-Cookie": {
                description: "Cookie borrada (expirada)",
                schema: { type: "string" },
                example:
                  "canlab_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
              },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OkResponse" },
                example: { ok: true },
              },
            },
          },
        },
      },
    },
  },
} as const;
