import { esBoca } from "../circuitos/largo";
import type { Plano, Proyecto, RectAmbiente } from "./tipos";

export const PASO_REJILLA_M = 0.1;

/** Ajusta una medida a la rejilla de 0,1 m. */
export function ajustarARejilla(m: number): number {
  const r = Math.round(Math.round(m / PASO_REJILLA_M) * PASO_REJILLA_M * 10) / 10;
  return r === 0 ? 0 : r; // evita -0
}

/** Rectángulo inicial de un ambiente: según su superficie (proporción 4:3) o 3 × 3 m, a la derecha de lo ya dibujado. */
export function rectPorDefecto(p: Proyecto, ambienteId: string): RectAmbiente {
  const amb = p.ambientes.find((a) => a.id === ambienteId);
  let anchoM = 3;
  let altoM = 3;
  if (amb?.superficieM2 && amb.superficieM2 > 0) {
    anchoM = ajustarARejilla(Math.max(1, Math.sqrt((amb.superficieM2 * 4) / 3)));
    altoM = ajustarARejilla(Math.max(1, amb.superficieM2 / anchoM));
  }
  const derecha = (p.plano?.ambientes ?? []).reduce((m, r) => Math.max(m, r.x + r.anchoM), 0);
  return { ambienteId, x: derecha > 0 ? ajustarARejilla(derecha + 0.5) : 0, y: 0, anchoM, altoM };
}

/** Caja que contiene todo lo dibujado (para encuadrar la vista). */
export function limitesPlano(plano: Plano | undefined): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const r of plano?.ambientes ?? []) {
    xs.push(r.x, r.x + r.anchoM);
    ys.push(r.y, r.y + r.altoM);
  }
  for (const q of [...Object.values(plano?.posiciones ?? {}), ...(plano?.tablero ? [plano.tablero] : [])]) {
    xs.push(q.x);
    ys.push(q.y);
  }
  if (xs.length === 0) return { minX: 0, minY: 0, maxX: 8, maxY: 8 };
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/** Saca del plano lo que ya no existe en el proyecto (ambientes y elementos borrados, enchufados, teclas). */
export function podarPlano(p: Proyecto): Proyecto {
  if (!p.plano) return p;
  const ambientes = new Set(p.ambientes.map((a) => a.id));
  const bocas = new Set(p.elementos.filter(esBoca).map((e) => e.id));
  const posiciones = Object.fromEntries(Object.entries(p.plano.posiciones).filter(([id]) => bocas.has(id)));
  return { ...p, plano: { ...p.plano, ambientes: p.plano.ambientes.filter((r) => ambientes.has(r.ambienteId)), posiciones } };
}
