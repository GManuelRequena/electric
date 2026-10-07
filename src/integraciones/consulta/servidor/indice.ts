import { readFileSync } from "node:fs";
import { aea770 } from "@/dominio/normas/aea770";
import type { Fuente } from "@/dominio/normas/tipos";

/** Un pedazo de la norma (un artículo o una tabla) con su cita. El texto de la Guía NO se versiona: vive en data/indice-norma.json. */
export interface Fragmento {
  id: string;
  texto: string;
  fuente: Fuente;
}

export interface Indice {
  fragmentos: Fragmento[];
  /** Para BM25 */
  tokens: string[][];
  frecuenciaDoc: Record<string, number>;
  largoPromedio: number;
}

const VACIAS = new Set(["de", "la", "el", "los", "las", "en", "un", "una", "y", "del", "que", "por", "con", "para", "se", "es", "al", "lo", "su"]);

export function tokenizar(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !VACIAS.has(t));
}

export function construirIndice(fragmentos: Fragmento[]): Indice {
  const tokens = fragmentos.map((f) => tokenizar(`${f.fuente.referencia} ${f.texto}`));
  const frecuenciaDoc: Record<string, number> = {};
  for (const ts of tokens) for (const t of new Set(ts)) frecuenciaDoc[t] = (frecuenciaDoc[t] ?? 0) + 1;
  const largoPromedio = tokens.length ? tokens.reduce((s, t) => s + t.length, 0) / tokens.length : 0;
  return { fragmentos, tokens, frecuenciaDoc, largoPromedio };
}

export interface Resultado {
  fragmento: Fragmento;
  puntaje: number;
}

/** BM25 clásico (k1 = 1,5; b = 0,75). */
export function buscar(indice: Indice, consulta: string, k = 5): Resultado[] {
  const q = [...new Set(tokenizar(consulta))];
  const N = indice.fragmentos.length;
  const resultados: Resultado[] = [];
  indice.tokens.forEach((ts, i) => {
    let puntaje = 0;
    for (const t of q) {
      const f = ts.filter((x) => x === t).length;
      if (f === 0) continue;
      const n = indice.frecuenciaDoc[t] ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      puntaje += (idf * f * 2.5) / (f + 1.5 * (0.25 + (0.75 * ts.length) / (indice.largoPromedio || 1)));
    }
    if (puntaje > 0) resultados.push({ fragmento: indice.fragmentos[i], puntaje });
  });
  return resultados.sort((a, b) => b.puntaje - a.puntaje).slice(0, Math.max(1, Math.min(k, 10)));
}

/** Una entrada por tabla transcripta del repo (título y notas): sirve aunque no haya PDFs ingestados. */
export function fragmentosDeTablas(): Fragmento[] {
  return Object.values(aea770).map((t) => ({
    id: `tabla:${t.id}`,
    texto: `${t.titulo}. ${t.nota ?? ""} Tabla ${t.id}${t.verificado ? "" : " (sin verificar)"}. Columnas: ${Object.keys((t.filas[0] ?? {}) as object).join(", ")}.`,
    fuente: t.fuente,
  }));
}

/** Parte un texto plano (salida de pdftotext/OCR) por artículo ("770.7.2 ...") y lo corta en pedazos de hasta `max` caracteres. El form feed (\f) cuenta páginas. */
export function partirPorArticulo(texto: string, base: Omit<Fuente, "referencia" | "pagina">, max = 1500): Fragmento[] {
  const salida: Fragmento[] = [];
  let pagina = 1;
  let ref = "Introducción";
  let refPagina = 1;
  let buffer: string[] = [];
  const volcar = () => {
    const cuerpo = buffer.join("\n").trim();
    buffer = [];
    if (!cuerpo) return;
    for (let i = 0, n = 1; i < cuerpo.length; i += max, n++) {
      salida.push({
        id: `${base.documento}:${ref}:${n}`,
        texto: cuerpo.slice(i, i + max),
        fuente: { ...base, referencia: `Art. ${ref}`.replace("Art. Introducción", "Introducción"), pagina: refPagina },
      });
    }
  };
  for (const linea of texto.split("\n")) {
    const saltos = (linea.match(/\f/g) ?? []).length;
    pagina += saltos;
    const limpia = linea.replace(/\f/g, "");
    const m = /^\s*(\d{3}(?:\.\d+){1,4})\s+\S/.exec(limpia);
    if (m) {
      volcar();
      ref = m[1];
      refPagina = pagina;
    }
    buffer.push(limpia);
  }
  volcar();
  return salida;
}

let cache: { ruta: string; indice: Indice } | undefined;

/** Índice = tablas del repo + (si existe) el archivo generado por `npm run ingestar`. */
export function cargarIndice(ruta = process.env.INDICE_NORMA ?? "data/indice-norma.json"): Indice {
  if (cache?.ruta === ruta) return cache.indice;
  let privados: Fragmento[] = [];
  try {
    privados = JSON.parse(readFileSync(ruta, "utf8")) as Fragmento[];
  } catch {
    /* sin ingesta todavía: se responde solo con las tablas transcriptas */
  }
  const indice = construirIndice([...fragmentosDeTablas(), ...privados]);
  cache = { ruta, indice };
  return indice;
}
