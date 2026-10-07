/** Estado de una calculadora codificado en la URL (`?s=...`), para compartir un cálculo como link. */

const PARAM = "s";

function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(b64: string): string {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function codificarEstado(estado: Record<string, string>): string {
  return aBase64Url(JSON.stringify(estado));
}

/** Devuelve solo las claves de `base` presentes como string; ignora todo lo demás (la URL es entrada no confiable). */
export function decodificarEstado<T extends Record<string, string>>(codigo: string | null | undefined, base: T): T {
  if (!codigo) return base;
  try {
    const crudo: unknown = JSON.parse(deBase64Url(codigo));
    if (typeof crudo !== "object" || crudo === null) return base;
    const salida: Record<string, string> = { ...base };
    for (const k of Object.keys(base)) {
      const v = (crudo as Record<string, unknown>)[k];
      if (typeof v === "string" && v.length <= 40) salida[k] = v;
    }
    return salida as T;
  } catch {
    return base;
  }
}

export function urlCompartible(origen: string, ruta: string, estado: Record<string, string>): string {
  return `${origen}${ruta}?${PARAM}=${codificarEstado(estado)}`;
}

export function leerEstadoDeUrl<T extends Record<string, string>>(busqueda: string, base: T): T {
  return decodificarEstado(new URLSearchParams(busqueda).get(PARAM), base);
}
