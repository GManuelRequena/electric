/** Login mínimo: una contraseña única (APP_PASSWORD) y una cookie firmada con HMAC. Usa Web Crypto para andar también en el proxy. */
export const COOKIE_SESION = "electricista_sesion";
export const DURACION_SESION_S = 60 * 60 * 24 * 30;

const enc = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function firmar(mensaje: string, secreto: string): Promise<string> {
  const clave = await crypto.subtle.importKey("raw", enc.encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", clave, enc.encode(mensaje)));
}

/** Comparación en tiempo constante (evita filtrar la contraseña por tiempos de respuesta). */
export function iguales(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let dif = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) dif |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return dif === 0;
}

export interface ConfigAuth {
  password?: string;
  secreto?: string;
}

export function configAuthDeEntorno(env: Record<string, string | undefined> = process.env): ConfigAuth {
  const password = env.APP_PASSWORD || undefined;
  return { password, secreto: env.SESSION_SECRET || password };
}

export async function crearToken(secreto: string, ahoraMs = Date.now()): Promise<string> {
  const vence = Math.floor(ahoraMs / 1000) + DURACION_SESION_S;
  return `${vence}.${await firmar(String(vence), secreto)}`;
}

export async function verificarToken(token: string | undefined, secreto: string | undefined, ahoraMs = Date.now()): Promise<boolean> {
  if (!token || !secreto) return false;
  const [vence, firma] = token.split(".");
  if (!vence || !firma || !/^\d+$/.test(vence) || Number(vence) < Math.floor(ahoraMs / 1000)) return false;
  return iguales(firma, await firmar(vence, secreto));
}
