import { caidaTension, type EntradaCaidaSinSeccion } from "./caida";
import { elegirTermica } from "./proteccion";
import type { Material, MotivoSeccion, Paso } from "./tipos";
import { aea770, avisoNoVerificado, fmt, seccionesConIz, type Norma } from "./util";

export interface EntradaSeccion {
  ibA: number;
  minimaMm2: number; // mínima de la norma para el tipo de circuito
  metodoInstalacion: string;
  material: Material;
  calibreMaxTipoA?: number | null; // tope de In del tipo de circuito
  caida?: EntradaCaidaSinSeccion & { limitePct: number };
}

export interface ResultadoSeccion {
  seccionMm2: number;
  motivo: MotivoSeccion;
  izA: number;
  inA: number;
  pasos: Paso[];
  advertencias: string[];
  caida?: { volts: number; pct: number };
}

/**
 * Sección = máximo entre la mínima de la norma, la que da Ib ≤ In ≤ Iz y la que cumple la caída de tensión.
 * Devuelve el motivo que fijó la sección y propone la sección que corrige si la caída no cumplía.
 */
export function elegirSeccion(e: EntradaSeccion, norma: Norma = aea770): ResultadoSeccion | { error: string } {
  const candidatas = seccionesConIz(e.metodoInstalacion, e.material, norma);
  if (candidatas.length === 0) {
    return { error: `No hay corrientes admisibles cargadas para "${e.metodoInstalacion}" en ${e.material}.` };
  }

  const pasos: Paso[] = [];
  const advertencias: string[] = [];
  const elegibles = candidatas.filter((c) => c.seccionMm2 >= e.minimaMm2);
  if (elegibles.length === 0) return { error: `Ninguna sección cargada alcanza la mínima de ${fmt(e.minimaMm2)} mm².` };

  // 1) Mínima de la norma → 2) Iz ≥ In ≥ Ib
  let porCorriente = elegibles.find((c) => {
    const t = elegirTermica(e.ibA, c.corrienteAdmisibleA, norma);
    return !("error" in t) && (e.calibreMaxTipoA == null || t.inA <= e.calibreMaxTipoA);
  });
  if (!porCorriente) {
    // Ninguna sección alcanza: devolvemos la última con el error de la térmica para explicarlo.
    const ultima = elegibles[elegibles.length - 1];
    const t = elegirTermica(e.ibA, ultima.corrienteAdmisibleA, norma);
    return {
      error:
        "error" in t
          ? `Ninguna sección cargada cumple Ib ≤ In ≤ Iz: ${t.error}`
          : `La térmica de ${t.inA} A supera el calibre máximo del tipo de circuito (${e.calibreMaxTipoA} A). Dividí el circuito.`,
    };
  }
  const tCorriente = elegirTermica(e.ibA, porCorriente.corrienteAdmisibleA, norma);
  if ("error" in tCorriente) return { error: tCorriente.error };

  let motivo: MotivoSeccion = porCorriente.seccionMm2 > elegibles[0].seccionMm2 ? "corriente" : "minima_norma";
  pasos.push({
    titulo: "Sección por corriente admisible",
    formula: "Iz ≥ In ≥ Ib",
    detalle:
      `Mínima de la norma: ${fmt(e.minimaMm2)} mm². Con ${fmt(porCorriente.seccionMm2)} mm² → Iz = ${fmt(porCorriente.corrienteAdmisibleA)} A ` +
      `(${e.metodoInstalacion}).`,
    fuente: porCorriente.fuente,
    advertencia: avisoNoVerificado(porCorriente, `Iz de ${fmt(porCorriente.seccionMm2)} mm²`),
  });
  const av = avisoNoVerificado(porCorriente, `Iz de ${fmt(porCorriente.seccionMm2)} mm²`);
  if (av) advertencias.push(av);

  // 3) Caída de tensión
  let elegida = porCorriente;
  let caida: { volts: number; pct: number } | undefined;
  if (e.caida) {
    const base = e.caida;
    const evaluar = (s: number) => caidaTension({ ...base, seccionMm2: s });
    const inicial = evaluar(porCorriente.seccionMm2);
    const cumpleInicial = inicial.pct <= base.limitePct;
    const mejor = elegibles.find((c) => c.seccionMm2 >= porCorriente.seccionMm2 && evaluar(c.seccionMm2).pct <= base.limitePct);
    if (!mejor) {
      const ultima = elegibles[elegibles.length - 1];
      return {
        error: `Ni con ${fmt(ultima.seccionMm2)} mm² la caída cumple el ${fmt(base.limitePct)} % (queda en ${fmt(evaluar(ultima.seccionMm2).pct)} %).`,
      };
    }
    if (!cumpleInicial) {
      motivo = "caida_tension";
      elegida = mejor;
      pasos.push({
        titulo: "Ajuste de sección por caída de tensión",
        detalle:
          `Con ${fmt(porCorriente.seccionMm2)} mm² la caída sería ${fmt(inicial.pct)} % (> ${fmt(base.limitePct)} %). ` +
          `Con ${fmt(mejor.seccionMm2)} mm² la caída es ${fmt(evaluar(mejor.seccionMm2).pct)} %.`,
      });
      const av2 = avisoNoVerificado(mejor, `Iz de ${fmt(mejor.seccionMm2)} mm²`);
      if (av2) advertencias.push(av2);
    }
    caida = evaluar(elegida.seccionMm2);
  }

  const tFinal = elegirTermica(e.ibA, elegida.corrienteAdmisibleA, norma);
  if ("error" in tFinal) return { error: tFinal.error };
  pasos.push(...tFinal.pasos);
  advertencias.push(...tFinal.advertencias);

  return {
    seccionMm2: elegida.seccionMm2,
    motivo,
    izA: elegida.corrienteAdmisibleA,
    inA: tFinal.inA,
    pasos,
    advertencias,
    caida,
  };
}
