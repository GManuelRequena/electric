import type { Sistema } from "./tipos";

export interface EntradaCaida {
  corrienteA: number;
  largoM: number; // largo de ida (un solo conductor)
  seccionMm2: number;
  resistividadOhmMm2PorM: number;
  sistema: Sistema;
  cosPhi: number;
  tensionV: number; // nominal; el % se mide siempre sobre esta
}

/**
 * Monofásico: ΔU = 2 · L · I · (ρ / S) · cos φ (ida y vuelta, Módulo 4 del curso, pág. 342: ΔU = I · R, R = ρ · 2L / S).
 * Trifásico:  ΔU = √3 · L · I · (ρ / S) · cos φ.
 * El curso no incluye cos φ; se agrega para cargas inductivas (con cos φ = 1 coincide con el curso).
 */
export function caidaTension(e: EntradaCaida): { volts: number; pct: number } {
  if (!(e.seccionMm2 > 0) || !(e.tensionV > 0) || e.largoM < 0 || e.corrienteA < 0) {
    throw new RangeError("Sección y tensión > 0; largo y corriente ≥ 0.");
  }
  const k = e.sistema === "trifasico" ? Math.sqrt(3) : 2;
  const volts = (k * e.largoM * e.corrienteA * e.resistividadOhmMm2PorM * e.cosPhi) / e.seccionMm2;
  return { volts, pct: (volts / e.tensionV) * 100 };
}

export type EntradaCaidaSinSeccion = Omit<EntradaCaida, "seccionMm2">;

export interface FilaCaida {
  seccionMm2: number;
  volts: number;
  pct: number;
  cumple: boolean;
}

/** Caída de todas las secciones para el mismo tramo; sirve para ver cuál es la primera que cumple. */
export function tablaCaidaPorSeccion(e: EntradaCaidaSinSeccion, secciones: number[], limitePct: number): FilaCaida[] {
  return [...secciones]
    .sort((a, b) => a - b)
    .map((s) => {
      const r = caidaTension({ ...e, seccionMm2: s });
      return { seccionMm2: s, ...r, cumple: r.pct <= limitePct };
    });
}

/** Menor sección (de la lista dada) cuya caída no supera el límite; undefined si ninguna alcanza. */
export function seccionMinimaPorCaida(e: EntradaCaidaSinSeccion, secciones: number[], limitePct: number): number | undefined {
  return tablaCaidaPorSeccion(e, secciones, limitePct).find((f) => f.cumple)?.seccionMm2;
}

/** Largo de ida máximo para el que la caída con esa sección no supera el límite. */
export function largoMaximo(e: Omit<EntradaCaida, "largoM">, limitePct: number): number {
  const k = e.sistema === "trifasico" ? Math.sqrt(3) : 2;
  if (e.corrienteA === 0 || e.cosPhi === 0) return Infinity;
  const vMax = (limitePct / 100) * e.tensionV;
  return (vMax * e.seccionMm2) / (k * e.corrienteA * e.resistividadOhmMm2PorM * e.cosPhi);
}

/** Tensión estimada en el extremo si se midió una tensión distinta en el origen. */
export function tensionEnExtremo(tensionOrigenV: number, caidaVolts: number): number {
  return tensionOrigenV - caidaVolts;
}
