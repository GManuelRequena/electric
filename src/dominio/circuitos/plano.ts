import { ALTURAS_POR_DEFECTO, type AlturasMontaje, type Elemento, type Proyecto } from "../proyecto/tipos";
import { elementosDeCircuito, esBoca } from "./largo";

export interface ResultadoPlano {
  largoM: number;
  bocasUbicadas: number;
  bocasTotales: number;
  /** Orden en que el recorrido pasa por las bocas (ids de elemento). */
  recorrido: string[];
}

export function alturasDe(p: Proyecto): AlturasMontaje {
  return { ...ALTURAS_POR_DEFECTO, ...p.config.alturas };
}

/** Altura de montaje de un elemento: tomas a `tomaM`; luces y artefactos fijos a `techoM`. */
export function alturaDeElemento(e: Elemento, a: AlturasMontaje): number {
  return e.tipo === "toma_general" || e.tipo === "toma_especial" || e.tipo === "toma_exterior" ? a.tomaM : a.techoM;
}

export function bocasDeCircuito(p: Proyecto, circuitoId: string): Elemento[] {
  return elementosDeCircuito(p, circuitoId).filter(esBoca);
}

/** Cuántas bocas del circuito ya tienen posición en el plano. */
export function estadoPlanoDeCircuito(p: Proyecto, circuitoId: string): { ubicadas: number; total: number } {
  const bocas = bocasDeCircuito(p, circuitoId);
  return { ubicadas: bocas.filter((b) => p.plano?.posiciones[b.id]).length, total: bocas.length };
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Largo de cable de un circuito medido sobre el plano.
 * Recorrido ortogonal (Manhattan) desde el tablero: en cada paso va a la boca más cercana que falta
 * (|Δx| + |Δy| + |Δaltura|, la altura es la subida/bajada por el montaje). No vuelve al tablero.
 * Devuelve `null` si no hay plano, no hay tablero, el circuito no tiene bocas o falta ubicar alguna boca:
 * en esos casos hay que seguir con la estimación.
 */
export function largoDesdePlano(circuitoId: string, p: Proyecto): ResultadoPlano | null {
  const plano = p.plano;
  if (!plano?.tablero) return null;
  const bocas = bocasDeCircuito(p, circuitoId);
  if (bocas.length === 0 || bocas.some((b) => !plano.posiciones[b.id])) return null;

  const alt = alturasDe(p);
  type P3 = { x: number; y: number; h: number };
  const dist = (a: P3, b: P3) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.h - b.h);
  let actual: P3 = { ...plano.tablero, h: alt.tableroM };
  const pendientes = bocas.map((b) => ({ id: b.id, p: { ...plano.posiciones[b.id], h: alturaDeElemento(b, alt) } }));
  const recorrido: string[] = [];
  let total = 0;
  while (pendientes.length > 0) {
    let mejor = 0;
    for (let i = 1; i < pendientes.length; i++) if (dist(actual, pendientes[i].p) < dist(actual, pendientes[mejor].p)) mejor = i;
    const [sig] = pendientes.splice(mejor, 1);
    total += dist(actual, sig.p);
    actual = sig.p;
    recorrido.push(sig.id);
  }
  return { largoM: redondear(total), bocasUbicadas: bocas.length, bocasTotales: bocas.length, recorrido };
}
