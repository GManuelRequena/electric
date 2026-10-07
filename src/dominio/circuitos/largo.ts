import type { Circuito, Elemento, Proyecto } from "../proyecto/tipos";
import { ES_TECLA } from "../proyecto/tipos";

/** Una boca es todo punto de utilización: luz, toma o artefacto fijo. Las teclas y lo enchufado no cuentan. */
export function esBoca(e: Elemento): boolean {
  return !ES_TECLA(e.tipo) && !(e.tipo === "artefacto" && e.enchufadoEn);
}

export function elementosDeCircuito(p: Proyecto, circuitoId: string): Elemento[] {
  return p.elementos.filter((e) => e.circuitoId === circuitoId);
}

export function contarBocas(p: Proyecto, circuitoId: string): number {
  return elementosDeCircuito(p, circuitoId).filter(esBoca).length;
}

/** Largo estimado: bocas × metros por boca + metros hasta el tablero (valores de `p.config`). */
export function estimarLargo(circuito: Circuito, p: Proyecto): number {
  const bocas = contarBocas(p, circuito.id);
  return bocas * p.config.metrosPorBoca + p.config.metrosHastaTablero;
}

/** Largo a usar en el cálculo: el cargado a mano o, si no hay, el estimado (marcado como tal). */
export function largoDeCircuito(circuito: Circuito, p: Proyecto): { largoM: number; estimado: boolean } {
  if (circuito.largoM != null && circuito.largoM > 0) return { largoM: circuito.largoM, estimado: false };
  return { largoM: estimarLargo(circuito, p), estimado: true };
}
