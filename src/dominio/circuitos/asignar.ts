import { aea770, corrienteArtefacto, metodosDisponibles, type Norma, type TipoCircuito } from "../calculo";
import { TENSION_MONOFASICA_V, ES_TECLA, type Circuito, type Elemento, type Proyecto } from "../proyecto/tipos";
import { esBoca } from "./largo";

type FilaTipo = Norma["tiposCircuito"]["filas"][number];

const ORDEN_TIPOS: TipoCircuito[] = ["IUG", "TUG", "TUE", "IUE", "ACU", "MBTF", "APM", "ATE", "MBTS", "OCE"];

function fila(norma: Norma, tipo: TipoCircuito): FilaTipo | undefined {
  return norma.tiposCircuito.filas.find((f) => f.tipo === tipo);
}

function tensionDe(p: Proyecto): number {
  return p.config.tensionV ?? TENSION_MONOFASICA_V;
}

/** Corriente de las cargas simultáneas de un elemento (0 si no tiene carga conocida). */
function corrienteDe(e: Elemento, tensionV: number): number {
  const a = e.artefacto;
  if (!a || !a.simultaneo) return 0;
  try {
    return corrienteArtefacto(a, tensionV, "monofasico");
  } catch {
    return 0;
  }
}

/** Tipo de circuito que le corresponde a un elemento suelto; las tablas dicen los límites de cada tipo. */
export function tipoCircuitoDe(e: Elemento, p: Proyecto, norma: Norma = aea770): TipoCircuito | null {
  switch (e.tipo) {
    case "boca_luz":
      return "IUG";
    case "toma_general":
      return "TUG";
    case "toma_especial":
    case "toma_exterior": // Tabla 770.8.I: los TUE incluyen las instalaciones a la intemperie
      return "TUE";
    case "artefacto": {
      if (e.enchufadoEn) return null; // sigue a su toma
      const a = e.artefacto;
      if (!a) return "TUG";
      const iu = corrienteArtefacto({ ...a, cantidad: 1 }, tensionDe(p), "monofasico");
      const maxTug = fila(norma, "TUG")?.corrientePorBocaMaxA ?? Infinity;
      const maxTue = fila(norma, "TUE")?.corrientePorBocaMaxA ?? Infinity;
      if (a.requiereCircuitoPropio || iu > maxTug) return iu > maxTue ? "ACU" : "TUE";
      return a.categoria === "iluminacion" ? "IUG" : "TUG";
    }
    default:
      return null; // teclas
  }
}

interface Unidad {
  elemento: Elemento;
  tipo: TipoCircuito;
  enchufados: Elemento[];
  corrienteA: number;
  exclusiva: boolean; // pide circuito propio
}

interface Estado {
  circuito: Circuito;
  bocas: number;
  corrienteA: number;
  exclusivo: boolean;
  fijo: boolean; // tiene elementos fijados a mano: solo recibe elementos manuales
}

function idLibre(tipo: TipoCircuito, usados: Set<string>): string {
  let n = 1;
  while (usados.has(`${tipo}${n}`)) n++;
  return `${tipo}${n}`;
}

/**
 * Asigna cada elemento a un circuito según la AEA 770. Todos los límites salen de la tabla `tiposCircuito`:
 * - luces → IUG, tomas generales → TUG, tomas especiales y exteriores → TUE; iluminación y tomas generales no comparten circuito;
 * - un artefacto que pide circuito propio (o supera la corriente de un TUG) va solo en un TUE o ACU;
 * - al superar el máximo de bocas o la corriente del calibre máximo del tipo se abre otro circuito del mismo tipo;
 * - los elementos con `asignacionManual` conservan su circuito, y ese circuito no recibe otros elementos automáticos.
 * Los circuitos mínimos por grado no se completan: la cantidad (Tabla 770.7.II) todavía no está cargada; ver `validarProyecto`.
 */
export function asignarCircuitos(p: Proyecto, norma: Norma = aea770): Proyecto {
  const tensionV = tensionDe(p);
  const metodo = p.config.metodoInstalacion ?? metodosDisponibles(norma)[0];
  const anteriores = new Map(p.circuitos.map((c) => [c.id, c]));
  const elementos = new Map(p.elementos.map((e) => [e.id, { ...e }]));
  const estados = new Map<string, Estado>();
  const usados = new Set<string>();

  // Circuitos fijados a mano: se conservan con sus datos.
  for (const e of elementos.values()) {
    if (!e.asignacionManual) continue;
    const previo = e.circuitoId ? anteriores.get(e.circuitoId) : undefined;
    if (!previo) {
      e.asignacionManual = false;
      e.circuitoId = undefined;
      continue;
    }
    if (!estados.has(previo.id)) {
      estados.set(previo.id, { circuito: { ...previo, resultado: undefined, error: undefined }, bocas: 0, corrienteA: 0, exclusivo: false, fijo: true });
      usados.add(previo.id);
    }
  }

  // Unidades automáticas: cada boca con lo que se le enchufa.
  const unidades: Unidad[] = [];
  const porToma = new Map<string, Elemento[]>();
  for (const e of elementos.values()) {
    if (e.tipo === "artefacto" && e.enchufadoEn && elementos.has(e.enchufadoEn)) {
      porToma.set(e.enchufadoEn, [...(porToma.get(e.enchufadoEn) ?? []), e]);
    }
  }
  for (const e of elementos.values()) {
    if (ES_TECLA(e.tipo) || (e.tipo === "artefacto" && e.enchufadoEn && elementos.has(e.enchufadoEn))) continue;
    const enchufados = porToma.get(e.id) ?? [];
    let tipo = tipoCircuitoDe(e, p, norma) ?? "TUG";
    if (e.tipo !== "artefacto" && enchufados.some((x) => x.artefacto?.requiereCircuitoPropio)) tipo = "TUE";
    const corrienteA = corrienteDe(e, tensionV) + enchufados.reduce((s, x) => s + corrienteDe(x, tensionV), 0);
    const exclusiva =
      Boolean(e.artefacto?.requiereCircuitoPropio) || enchufados.some((x) => x.artefacto?.requiereCircuitoPropio) || tipo === "ACU";
    unidades.push({ elemento: e, tipo, enchufados, corrienteA, exclusiva });
  }

  const sumar = (id: string, u: Unidad) => {
    const est = estados.get(id)!;
    est.bocas += 1;
    est.corrienteA += u.corrienteA;
    if (u.exclusiva) est.exclusivo = true;
  };

  // Primero las cargas de los elementos fijados a mano, para que ocupen lugar.
  for (const u of unidades) {
    if (u.elemento.asignacionManual && u.elemento.circuitoId && estados.has(u.elemento.circuitoId)) sumar(u.elemento.circuitoId, u);
  }

  for (const u of unidades) {
    if (u.elemento.asignacionManual && u.elemento.circuitoId) continue;
    const f = fila(norma, u.tipo);
    const maxBocas = f?.maxBocas ?? Infinity;
    const maxA = f?.calibreMaxProteccionA ?? Infinity;
    let destino: string | undefined;
    if (!u.exclusiva) {
      destino = [...estados.values()].find(
        (s) => s.circuito.tipo === u.tipo && !s.fijo && !s.exclusivo && s.bocas < maxBocas && s.corrienteA + u.corrienteA <= maxA,
      )?.circuito.id;
    }
    if (!destino) {
      const id = idLibre(u.tipo, usados);
      usados.add(id);
      const previo = anteriores.get(id);
      const base: Circuito = previo && previo.tipo === u.tipo ? { ...previo, resultado: undefined, error: undefined } : { id, tipo: u.tipo, metodoInstalacion: metodo };
      estados.set(id, { circuito: base, bocas: 0, corrienteA: 0, exclusivo: false, fijo: false });
      destino = id;
    }
    u.elemento.circuitoId = destino;
    sumar(destino, u);
  }

  // Lo enchufado y las teclas siguen a su toma o a la primera luz que comandan.
  for (const u of unidades) {
    for (const x of u.enchufados) {
      if (x.asignacionManual && x.circuitoId && estados.has(x.circuitoId)) continue;
      x.circuitoId = u.elemento.circuitoId;
    }
  }
  for (const e of elementos.values()) {
    if (e.tipo === "artefacto" && e.enchufadoEn && !elementos.has(e.enchufadoEn)) e.enchufadoEn = undefined; // toma borrada
    if (!ES_TECLA(e.tipo)) continue;
    e.circuitoId = (e.comandaA ?? []).map((id) => elementos.get(id)?.circuitoId).find(Boolean);
  }

  const circuitos = [...estados.values()]
    .map((s) => s.circuito)
    .sort((a, b) => ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo) || a.id.localeCompare(b.id, "es", { numeric: true }));
  return { ...p, circuitos, elementos: p.elementos.map((e) => elementos.get(e.id)!) };
}

export type Destino = { circuitoId: string } | { nuevoTipo: TipoCircuito };

/** Mueve un elemento a otro circuito (o a uno nuevo) y lo marca como asignación manual. */
export function moverElemento(p: Proyecto, elementoId: string, destino: Destino, norma: Norma = aea770): Proyecto {
  const el = p.elementos.find((e) => e.id === elementoId);
  if (!el || !esBoca(el)) return p;
  let circuitos = p.circuitos;
  let circuitoId: string;
  if ("circuitoId" in destino) {
    if (!circuitos.some((c) => c.id === destino.circuitoId)) return p;
    circuitoId = destino.circuitoId;
  } else {
    circuitoId = idLibre(destino.nuevoTipo, new Set(circuitos.map((c) => c.id)));
    circuitos = [...circuitos, { id: circuitoId, tipo: destino.nuevoTipo, metodoInstalacion: p.config.metodoInstalacion ?? metodosDisponibles(norma)[0] }];
  }
  return {
    ...p,
    circuitos,
    elementos: p.elementos.map((e) => (e.id === elementoId ? { ...e, circuitoId, asignacionManual: true } : e)),
  };
}

/** Devuelve un elemento a la asignación automática. */
export function liberarElemento(p: Proyecto, elementoId: string): Proyecto {
  return { ...p, elementos: p.elementos.map((e) => (e.id === elementoId ? { ...e, asignacionManual: false } : e)) };
}
