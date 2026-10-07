import type { Sistema } from "./tipos";

/** Ib = P / (U · cos φ) en monofásico; Ib = P / (√3 · U · cos φ) en trifásico. */
export function corrienteDesdePotencia(potenciaW: number, tensionV: number, cosPhi: number, sistema: Sistema): number {
  if (!(potenciaW >= 0) || !(tensionV > 0) || !(cosPhi > 0 && cosPhi <= 1)) {
    throw new RangeError("Potencia ≥ 0, tensión > 0 y 0 < cos φ ≤ 1.");
  }
  const k = sistema === "trifasico" ? Math.sqrt(3) : 1;
  return potenciaW / (k * tensionV * cosPhi);
}

/** Inversa de la anterior: P = U · I · cos φ (mono) o √3 · U · I · cos φ (tri). */
export function potenciaDesdeCorriente(corrienteA: number, tensionV: number, cosPhi: number, sistema: Sistema): number {
  const k = sistema === "trifasico" ? Math.sqrt(3) : 1;
  return k * tensionV * corrienteA * cosPhi;
}
