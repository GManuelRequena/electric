import { ErrorCalculo, type Paso, type Sistema } from "./tipos";
import { fmt } from "./util";

/**
 * Herramientas extra (fase 5.E). Son fórmulas generales de electrotecnia: no contienen
 * ningún valor normativo, por eso los pasos no llevan `fuente` sino la aclaración de que
 * la fórmula no es de la AEA.
 */
const NOTA_FORMULA: Paso = {
  titulo: "Alcance",
  detalle: "Fórmula general de electrotecnia. No es un valor de la AEA 90364: las tablas y límites de la norma se aplican en las calculadoras de circuitos.",
};

const SQRT3 = Math.sqrt(3);

function positivo(n: number | undefined, nombre: string): number | undefined {
  if (n == null) return undefined;
  if (!Number.isFinite(n) || n <= 0) throw new ErrorCalculo(`${nombre} debe ser mayor que 0.`);
  return n;
}

function cosValido(cos: number, nombre = "cos φ"): number {
  if (!Number.isFinite(cos) || cos <= 0 || cos > 1) throw new ErrorCalculo(`${nombre} debe estar entre 0 (sin incluir) y 1.`);
  return cos;
}

/* ---------- Ley de Ohm y potencia en CC ---------- */

export interface EntradaOhm {
  tensionV?: number;
  corrienteA?: number;
  resistenciaOhm?: number;
  potenciaW?: number;
}

export interface ResultadoOhm {
  tensionV: number;
  corrienteA: number;
  resistenciaOhm: number;
  potenciaW: number;
  pasos: Paso[];
}

/** Con dos de las cuatro magnitudes (V, I, R, P) calcula las otras dos. */
export function leyDeOhm(e: EntradaOhm): ResultadoOhm {
  const v = positivo(e.tensionV, "La tensión");
  const i = positivo(e.corrienteA, "La corriente");
  const r = positivo(e.resistenciaOhm, "La resistencia");
  const p = positivo(e.potenciaW, "La potencia");
  const dados = [v, i, r, p].filter((x) => x != null).length;
  if (dados !== 2) throw new ErrorCalculo("Ingresá exactamente dos datos (tensión, corriente, resistencia o potencia).");

  let V: number, I: number, R: number, P: number;
  let formula: string;
  if (v != null && i != null) { V = v; I = i; R = V / I; P = V * I; formula = "R = V / I ; P = V · I"; }
  else if (v != null && r != null) { V = v; R = r; I = V / R; P = V * I; formula = "I = V / R ; P = V · I"; }
  else if (v != null && p != null) { V = v; P = p; I = P / V; R = V / I; formula = "I = P / V ; R = V / I"; }
  else if (i != null && r != null) { I = i; R = r; V = I * R; P = V * I; formula = "V = I · R ; P = V · I"; }
  else if (i != null && p != null) { I = i; P = p; V = P / I; R = V / I; formula = "V = P / I ; R = V / I"; }
  else { R = r!; P = p!; I = Math.sqrt(P / R); V = I * R; formula = "I = √(P / R) ; V = I · R"; }

  return {
    tensionV: V, corrienteA: I, resistenciaOhm: R, potenciaW: P,
    pasos: [
      { titulo: "Ley de Ohm y potencia (corriente continua)", formula, detalle: `V = ${fmt(V)} V, I = ${fmt(I)} A, R = ${fmt(R)} Ω, P = ${fmt(P)} W.` },
      NOTA_FORMULA,
    ],
  };
}

/* ---------- Potencia en CA (monofásica / trifásica) ---------- */

export interface EntradaPotenciaCa {
  sistema: Sistema;
  tensionV: number; // monofásico: fase-neutro; trifásico: entre fases
  cosPhi: number;
  corrienteA?: number;
  potenciaW?: number;
}

export interface ResultadoPotenciaCa {
  corrienteA: number;
  potenciaActivaW: number;
  potenciaAparenteVA: number;
  potenciaReactivaVAr: number;
  pasos: Paso[];
}

/** Con la tensión y el cos φ, calcula P, S y Q a partir de I, o I a partir de P. */
export function potenciaCa(e: EntradaPotenciaCa): ResultadoPotenciaCa {
  const V = positivo(e.tensionV, "La tensión");
  if (V == null) throw new ErrorCalculo("Falta la tensión.");
  const cos = cosValido(e.cosPhi);
  const i = positivo(e.corrienteA, "La corriente");
  const p = positivo(e.potenciaW, "La potencia");
  if ((i == null) === (p == null)) throw new ErrorCalculo("Ingresá la corriente o la potencia (solo una).");
  const k = e.sistema === "trifasico" ? SQRT3 : 1;
  const formulaP = e.sistema === "trifasico" ? "P = √3 · V · I · cos φ" : "P = V · I · cos φ";
  const I = i ?? p! / (k * V * cos);
  const S = k * V * I;
  const P = S * cos;
  const Q = Math.sqrt(Math.max(S * S - P * P, 0));
  return {
    corrienteA: I, potenciaActivaW: P, potenciaAparenteVA: S, potenciaReactivaVAr: Q,
    pasos: [
      { titulo: "Potencia activa", formula: i != null ? formulaP : `I = P / (${k === 1 ? "" : "√3 · "}V · cos φ)`, detalle: `I = ${fmt(I)} A, P = ${fmt(P)} W.` },
      { titulo: "Potencia aparente y reactiva", formula: `S = ${k === 1 ? "" : "√3 · "}V · I ; Q = √(S² − P²)`, detalle: `S = ${fmt(S)} VA, Q = ${fmt(Q)} VAr.` },
      NOTA_FORMULA,
    ],
  };
}

/* ---------- Consumo energético y costo ---------- */

export interface EntradaConsumo {
  potenciaW: number;
  horasPorDia: number;
  diasPorMes: number;
  tarifaPorKwh: number;
}

export interface ResultadoConsumo {
  kwhDia: number;
  kwhMes: number;
  costoMes: number;
  pasos: Paso[];
}

export function consumoEnergetico(e: EntradaConsumo): ResultadoConsumo {
  const P = positivo(e.potenciaW, "La potencia")!;
  if (!Number.isFinite(e.horasPorDia) || e.horasPorDia <= 0 || e.horasPorDia > 24) throw new ErrorCalculo("Las horas por día deben estar entre 0 y 24.");
  if (!Number.isFinite(e.diasPorMes) || e.diasPorMes <= 0 || e.diasPorMes > 31) throw new ErrorCalculo("Los días por mes deben estar entre 0 y 31.");
  if (!Number.isFinite(e.tarifaPorKwh) || e.tarifaPorKwh < 0) throw new ErrorCalculo("La tarifa no puede ser negativa.");
  const kwhDia = (P * e.horasPorDia) / 1000;
  const kwhMes = kwhDia * e.diasPorMes;
  const costoMes = kwhMes * e.tarifaPorKwh;
  return {
    kwhDia, kwhMes, costoMes,
    pasos: [
      { titulo: "Energía", formula: "E = P · h / 1000", detalle: `${fmt(kwhDia)} kWh por día, ${fmt(kwhMes)} kWh en ${fmt(e.diasPorMes)} días.` },
      { titulo: "Costo", formula: "Costo = E · tarifa", detalle: `${fmt(kwhMes)} kWh × $${fmt(e.tarifaPorKwh)}/kWh = $${fmt(costoMes)}. La tarifa es un dato tuyo (no incluye impuestos ni cargos fijos).` },
      NOTA_FORMULA,
    ],
  };
}

/* ---------- Corrección del factor de potencia ---------- */

export interface EntradaFactorPotencia {
  potenciaW: number;
  cosActual: number;
  cosObjetivo: number;
}

export interface ResultadoFactorPotencia {
  kvar: number;
  qActualKvar: number;
  qObjetivoKvar: number;
  pasos: Paso[];
}

/** Qc = P · (tan φ1 − tan φ2): potencia reactiva del capacitor que lleva cos φ1 a cos φ2. */
export function correccionFactorPotencia(e: EntradaFactorPotencia): ResultadoFactorPotencia {
  const P = positivo(e.potenciaW, "La potencia")!;
  const c1 = cosValido(e.cosActual, "El cos φ actual");
  const c2 = cosValido(e.cosObjetivo, "El cos φ objetivo");
  if (c2 <= c1) throw new ErrorCalculo("El cos φ objetivo tiene que ser mayor que el actual.");
  const tan = (c: number) => Math.tan(Math.acos(c));
  const q1 = (P * tan(c1)) / 1000;
  const q2 = (P * tan(c2)) / 1000;
  return {
    kvar: q1 - q2, qActualKvar: q1, qObjetivoKvar: q2,
    pasos: [
      { titulo: "Reactiva antes y después", formula: "Q = P · tan(arccos cos φ)", detalle: `Q actual = ${fmt(q1)} kVAr, Q objetivo = ${fmt(q2)} kVAr.` },
      { titulo: "Capacitor necesario", formula: "Qc = P · (tan φ1 − tan φ2)", detalle: `Qc = ${fmt(q1 - q2)} kVAr. Elegí el valor comercial inmediato superior.` },
      NOTA_FORMULA,
    ],
  };
}

/* ---------- Dimensionado fotovoltaico básico ---------- */

export interface EntradaFotovoltaica {
  consumoDiarioWh: number;
  horasSolPico: number; // HSP del lugar y la época de diseño
  potenciaPanelWp: number;
  rendimiento: number; // 0-1: pérdidas de cables, regulador, temperatura, suciedad
  diasAutonomia: number;
  tensionBancoV: number;
  profundidadDescarga: number; // 0-1: fracción utilizable de la batería
}

export interface ResultadoFotovoltaico {
  panelesNecesarios: number;
  potenciaGeneradorWp: number;
  capacidadBancoAh: number;
  capacidadBancoWh: number;
  pasos: Paso[];
}

export function dimensionadoFotovoltaico(e: EntradaFotovoltaica): ResultadoFotovoltaico {
  const E = positivo(e.consumoDiarioWh, "El consumo diario")!;
  const hsp = positivo(e.horasSolPico, "Las horas sol pico")!;
  const wp = positivo(e.potenciaPanelWp, "La potencia del panel")!;
  const dias = positivo(e.diasAutonomia, "Los días de autonomía")!;
  const vb = positivo(e.tensionBancoV, "La tensión del banco")!;
  for (const [n, nombre] of [[e.rendimiento, "El rendimiento"], [e.profundidadDescarga, "La profundidad de descarga"]] as const) {
    if (!Number.isFinite(n) || n <= 0 || n > 1) throw new ErrorCalculo(`${nombre} debe estar entre 0 (sin incluir) y 1.`);
  }
  const generadorWp = E / (hsp * e.rendimiento);
  const paneles = Math.ceil(generadorWp / wp - 1e-9);
  const bancoWh = (E * dias) / e.profundidadDescarga;
  const bancoAh = bancoWh / vb;
  return {
    panelesNecesarios: paneles, potenciaGeneradorWp: paneles * wp, capacidadBancoAh: bancoAh, capacidadBancoWh: bancoWh,
    pasos: [
      { titulo: "Generador", formula: "Pg = E / (HSP · η) ; N = ⌈Pg / Wp⌉", detalle: `Pg = ${fmt(generadorWp)} Wp → ${paneles} paneles de ${fmt(wp)} Wp (${fmt(paneles * wp)} Wp instalados).` },
      { titulo: "Banco de baterías", formula: "C = E · días / (DoD · Vb)", detalle: `${fmt(bancoWh)} Wh → ${fmt(bancoAh)} Ah a ${fmt(vb)} V.` },
      { ...NOTA_FORMULA, advertencia: "Dimensionado orientativo: HSP, rendimiento y profundidad de descarga son datos tuyos o del fabricante. No verifica reglamentación de instalaciones fotovoltaicas." },
    ],
  };
}
