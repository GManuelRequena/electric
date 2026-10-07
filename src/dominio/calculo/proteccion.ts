import type { Curva, Paso, TipoCircuito } from "./tipos";
import { aea770, avisoNoVerificado, fmt, type Norma } from "./util";

/** Menor In normalizado con Ib ≤ In ≤ Iz; error si no existe. */
export function elegirTermica(
  ibA: number,
  izA: number,
  norma: Norma = aea770,
): { inA: number; pasos: Paso[]; advertencias: string[] } | { error: string } {
  const calibres = [...norma.calibresNormalizados.filas].sort((a, b) => a.calibreA - b.calibreA);
  const fila = calibres.find((c) => c.calibreA >= ibA);
  if (!fila) return { error: `No hay un calibre normalizado ≥ ${fmt(ibA)} A.` };
  if (fila.calibreA > izA) {
    return { error: `El menor calibre ≥ Ib es ${fila.calibreA} A y supera Iz = ${fmt(izA)} A.` };
  }
  const advertencias: string[] = [];
  const aviso = avisoNoVerificado(fila, `calibre normalizado de ${fila.calibreA} A`);
  if (aviso) advertencias.push(aviso);
  return {
    inA: fila.calibreA,
    advertencias,
    pasos: [
      {
        titulo: "Protección térmica",
        formula: "Ib ≤ In ≤ Iz",
        detalle: `${fmt(ibA)} A ≤ ${fila.calibreA} A ≤ ${fmt(izA)} A`,
        fuente: fila.fuente,
        advertencia: aviso,
      },
    ],
  };
}

/** Curva sugerida: B para iluminación, C para tomacorrientes (Guía AEA 770, pág. 44). */
export function sugerirCurva(tipo: TipoCircuito, norma: Norma = aea770): { curva: Curva; motivo: string; fuente: Norma["curvasDisparo"]["filas"][number]["fuente"]; verificado: boolean } {
  const curva: Curva = tipo === "IUG" || tipo === "IUE" ? "B" : "C";
  const fila = norma.curvasDisparo.filas.find((f) => f.curva === curva)!;
  const motivo =
    curva === "B"
      ? "Curva B para iluminación (disparo 3 a 5 In)."
      : tipo === "TUG" || tipo === "TUE"
        ? "Curva C para tomacorrientes (disparo 5 a 10 In)."
        : "Curva C por defecto (a criterio del proyectista; D para cargas muy capacitivas o inductivas).";
  return { curva, motivo, fuente: fila.fuente, verificado: fila.verificado };
}

const CON_DIFERENCIAL_30: TipoCircuito[] = ["IUG", "TUG", "IUE", "TUE"];

/** Diferencial: 30 mA obligatorio en circuitos terminales de iluminación o tomacorrientes. */
export function diferencialPara(tipo: TipoCircuito, norma: Norma = aea770) {
  const fila = norma.diferenciales.filas.find((f) => f.sensibilidadMaxMa === 30 && f.obligatorio)!;
  return { sensibilidadMa: 30, obligatorio: CON_DIFERENCIAL_30.includes(tipo), fila };
}
