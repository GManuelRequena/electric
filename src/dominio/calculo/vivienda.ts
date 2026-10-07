import type { Paso, TipoCircuito } from "./tipos";
import { aea770, agregarAviso, avisoNoVerificado, fmt, type Norma } from "./util";

export type Grado = "minimo" | "medio" | "elevado" | "superior";

export interface AmbienteVivienda {
  tipo: string; // clave de bocas-minimas-ambiente.json (p. ej. "estar-comedor", "pasillo", "bano")
  cantidad: number;
  superficieM2?: number; // de cada ambiente; necesaria para las reglas "1 boca cada X m²"
  largoM?: number; // de cada ambiente; necesaria para pasillos
}

export interface EntradaVivienda {
  superficieM2: number; // superficie cubierta
  superficieSemicubiertaM2?: number; // cuenta al 50 %
  ambientes: AmbienteVivienda[];
}

export interface ResultadoVivienda {
  superficieLimiteM2: number; // Sla = cubierta + 50 % de la semicubierta
  grado: Grado;
  circuitosMinimos: { tipo: TipoCircuito; cantidad: number }[];
  bocasPorAmbiente: { tipo: string; iluminacion: number; tomas: number; especiales: number }[];
  pasos: Paso[];
  advertencias: string[];
}

export function calcularVivienda(e: EntradaVivienda, norma: Norma = aea770): ResultadoVivienda {
  if (!(e.superficieM2 > 0)) throw new RangeError("La superficie debe ser mayor que 0.");
  const pasos: Paso[] = [];
  const advertencias: string[] = [];

  // Sla y grado
  const sla = e.superficieM2 + 0.5 * (e.superficieSemicubiertaM2 ?? 0);
  const grados = [...norma.gradosElectrificacion.filas].sort((a, b) => (a.slaMaxM2 ?? Infinity) - (b.slaMaxM2 ?? Infinity));
  const filaGrado = grados.find((g) => g.slaMaxM2 == null || sla <= g.slaMaxM2)!;
  pasos.push({
    titulo: "Superficie y grado de electrificación",
    formula: "Sla = superficie cubierta + 50 % de la semicubierta",
    detalle: `Sla = ${fmt(e.superficieM2)} + 0,5 · ${fmt(e.superficieSemicubiertaM2 ?? 0)} = ${fmt(sla)} m² → grado ${filaGrado.grado}.`,
    fuente: filaGrado.fuente,
    advertencia: avisoNoVerificado(filaGrado, "límites de superficie de los grados"),
  });
  agregarAviso(advertencias, avisoNoVerificado(filaGrado, "límites de superficie de los grados"));
  if (grados.some((g) => g.slaMaxM2 === sla)) {
    advertencias.push(`PENDIENTE_VERIFICAR: ${fmt(sla)} m² está justo en un límite entre grados; confirmar si ese valor pertenece al grado inferior o al superior.`);
  }

  // Circuitos mínimos
  const circuitosMinimos: ResultadoVivienda["circuitosMinimos"] = [];
  if (filaGrado.circuitosMinimos == null) {
    advertencias.push("PENDIENTE_VERIFICAR: la cantidad mínima de circuitos por grado (Tabla 770.7.II) todavía no está cargada.");
  }

  // Bocas por ambiente
  const bocasPorAmbiente: ResultadoVivienda["bocasPorAmbiente"] = [];
  for (const amb of e.ambientes) {
    const reglas = norma.bocasMinimasAmbiente.filas.filter((r) => r.ambiente === amb.tipo && r.grados.includes(filaGrado.grado));
    if (!norma.bocasMinimasAmbiente.filas.some((r) => r.ambiente === amb.tipo)) {
      advertencias.push(`PENDIENTE_VERIFICAR: no hay reglas cargadas para el ambiente "${amb.tipo}".`);
      continue;
    }
    const total = { iluminacion: 0, tomas: 0, especiales: 0 };
    for (const r of reglas) {
      let bocas = r.minimoBocas;
      if (r.cadaM2 != null) {
        if (amb.superficieM2 != null) bocas = Math.max(bocas, Math.ceil(amb.superficieM2 / r.cadaM2));
        else advertencias.push(`Falta la superficie de "${amb.tipo}": se usó el mínimo de ${r.minimoBocas} boca(s) ${r.tipoBoca}.`);
      }
      if (r.cadaMLongitudM != null) {
        if (amb.largoM != null) bocas = Math.max(bocas, Math.ceil(amb.largoM / r.cadaMLongitudM));
        else advertencias.push(`Falta el largo de "${amb.tipo}": se usó el mínimo de ${r.minimoBocas} boca(s) ${r.tipoBoca}.`);
      }
      bocas *= amb.cantidad;
      if (r.tipoBoca === "IUG") total.iluminacion += bocas;
      else if (r.tipoBoca === "TUG") total.tomas += bocas;
      else total.especiales += bocas;
      agregarAviso(advertencias, avisoNoVerificado(r, `bocas mínimas de ${amb.tipo} (${r.tipoBoca})`));
    }
    bocasPorAmbiente.push({ tipo: amb.tipo, ...total });
    const ref = reglas[0];
    pasos.push({
      titulo: `Bocas mínimas: ${amb.tipo}${amb.cantidad > 1 ? ` ×${amb.cantidad}` : ""}`,
      detalle: `Iluminación ${total.iluminacion} · Tomas ${total.tomas} · Especiales ${total.especiales}.`,
      fuente: ref?.fuente,
      advertencia: ref ? avisoNoVerificado(ref, "bocas mínimas") : undefined,
    });
  }

  return { superficieLimiteM2: sla, grado: filaGrado.grado, circuitosMinimos, bocasPorAmbiente, pasos, advertencias };
}
