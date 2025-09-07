// src/utils/name.ts
// Helper para inferir un “nombre” a partir de un email.
// - Soporta alias +tag, separadores (., _, -), Unicode y tildes
// - Maneja jperez / jcperez como inicial(es) + apellido
// - Evita buzones genéricos (info, ventas, soporte, noreply, etc.)

const BLACKLIST = new Set<string>([
  "info","contacto","contact","ventas","sales","compras","purchase","admin","root","soporte","support",
  "hello","hola","hi","team","marketing","newsletter","noreply","no","reply","billing","facturas","contabilidad",
  "hr","rrhh","jobs","careers","developer","dev","ux","ui","ops","it","corp","co","ltda","spa","sa","gmbh",
]);

function titleToken(tok: string): string {
  if (!tok) return "";
  if (tok.length === 1) return tok.toLocaleUpperCase("es-CL");
  const lower = tok.toLocaleLowerCase("es-CL");
  return lower.charAt(0).toLocaleUpperCase("es-CL") + lower.slice(1);
}

export function guessNameFromEmail(email: string): string {
  try {
    const rawEmail = String(email || "").trim();
    const at = rawEmail.indexOf("@");
    if (at <= 0) return "";

    // Parte local
    let local = rawEmail.slice(0, at).toLocaleLowerCase("es-CL");

    // Quitar alias +tag
    const plus = local.indexOf("+");
    if (plus > -1) local = local.slice(0, plus);

    // Separadores comunes => espacio
    local = local.replace(/[._\-]+/g, " ");

    // Dejar solo letras/números/espacios (Unicode si está disponible)
    let nonAlnum: RegExp;
    try {
      nonAlnum = new RegExp("[^\\p{L}\\p{N}\\s]", "gu");
    } catch {
      nonAlnum = /[^A-Za-z0-9\s]/g; // fallback
    }
    local = local.replace(nonAlnum, " ");

    // Colapsar espacios
    local = local.replace(/\s+/g, " ").trim();
    if (!local) return "";

    // Siempre asegurar string[]
    let parts: string[] = local.split(" ").filter((p): p is string => Boolean(p));

    // Filtrar tokens indeseados
    parts = parts.filter((p): p is string => {
      if (!p) return false;
      if (/^\d+$/.test(p)) return false;
      if (BLACKLIST.has(p)) return false;
      if (p.length === 1 && !/^[a-záéíóúüñ]$/i.test(p)) return false;
      return true;
    });

    if (parts.length === 0) return "";

    // Un solo token -> intenta inicial(es)+apellido o nombre simple
    if (parts.length === 1) {
      let one = parts[0] ?? "";
      one = one.replace(/\d+$/g, ""); // quita sufijos numéricos
      if (!one) return "";

      // jperez / jcperez  => "J Perez" / "J C Perez"
      const m = one.match(/^([a-záéíóúüñ]{1,2})([a-záéíóúüñ]{3,})$/i);
      const initials = m?.[1] ?? "";
      const last = m?.[2] ?? "";
      if (initials && last) {
        const prettyInitials = initials
          .split("")
          .map((ch) => ch.toLocaleUpperCase("es-CL"))
          .join(" ");
        return `${prettyInitials} ${titleToken(last)}`.trim();
      }

      if (one.length >= 3) return titleToken(one);
      return "";
    }

    // Múltiples tokens -> evita roles al final y toma 2–3 primeros
    const tailBlacklist = new Set<string>(["ux","ui","dev","team","sales","marketing","it"]);
    while (parts.length > 1 && tailBlacklist.has(parts[parts.length - 1]!)) {
      parts.pop();
    }
    parts = parts.slice(0, 3);

    // Ahora parts es string[] garantizado
    return parts.map((s) => titleToken(s)).join(" ");
  } catch {
    return "";
  }
}

/** Utilidad: si la "name" enviada es en realidad un email */
export function looksLikeEmail(s: string | undefined | null): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}
