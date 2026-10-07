import { aea770, calcularCircuito, ErrorCalculo, type Artefacto, type Norma } from "../calculo";
import { TENSION_MONOFASICA_V, type Circuito, type Proyecto } from "../proyecto/tipos";
import { podarPlano } from "../proyecto/plano";
import { asignarCircuitos } from "./asignar";
import { elementosDeCircuito, esBoca, largoDeCircuito } from "./largo";

/** Calcula un circuito del proyecto con el motor de la Fase 1 (cargas reales + demanda mínima de la tabla). */
export function calcularCircuitoDeProyecto(c: Circuito, p: Proyecto, norma: Norma = aea770): Circuito {
  const fila = norma.tiposCircuito.filas.find((f) => f.tipo === c.tipo);
  const elementos = elementosDeCircuito(p, c.id);
  const tensionV = p.config.tensionV ?? TENSION_MONOFASICA_V;
  const artefactos: Artefacto[] = [];

  const luces = elementos.filter((e) => e.tipo === "boca_luz");
  if (luces.length > 0) {
    const va = fila?.potenciaPorBocaVA;
    if (va == null) return { ...c, resultado: undefined, error: `La tabla no tiene potencia por boca para ${c.tipo}.` };
    artefactos.push({ id: "bocas-luz", nombre: `Bocas de luz (${va} VA c/u)`, potenciaW: va, cosPhi: 1, cantidad: luces.length, simultaneo: true, categoria: "iluminacion" });
  }
  for (const e of elementos) {
    if (e.artefacto) artefactos.push({ ...e.artefacto, id: e.id, categoria: e.artefacto.categoria });
  }

  // Demanda mínima del circuito (o el valor real si es mayor): se completa con la diferencia.
  const demandaVA = fila?.potenciaPorCircuitoVA ?? null;
  if (demandaVA != null && elementos.some(esBoca)) {
    const real = artefactos.filter((a) => a.simultaneo).reduce((s, a) => s + (a.potenciaW ?? (a.corrienteA ?? 0) * tensionV * (a.cosPhi ?? 1)) * a.cantidad, 0);
    if (real < demandaVA) {
      artefactos.push({ id: "demanda-minima", nombre: `Demanda mínima del circuito ${c.tipo} (${demandaVA} VA)`, potenciaW: demandaVA - real, cosPhi: 1, cantidad: 1, simultaneo: true, categoria: "toma" });
    }
  }
  if (artefactos.length === 0) return { ...c, resultado: undefined, error: "El circuito no tiene cargas." };

  const { largoM, estimado, origen } = largoDeCircuito(c, p);
  const desdePlano = origen === "plano";
  try {
    const resultado = calcularCircuito(
      { sistema: "monofasico", tensionV, artefactos, tipoCircuito: c.tipo, largoM, metodoInstalacion: c.metodoInstalacion, material: "cobre" },
      norma,
    );
    if (estimado) resultado.advertencias.push(`El largo de ${largoM} m es una estimación (bocas × ${p.config.metrosPorBoca} m + ${p.config.metrosHastaTablero} m hasta el tablero); cargá el largo real.`);
    if (desdePlano) resultado.advertencias.push(`El largo de ${largoM} m se midió sobre el plano (recorrido ortogonal desde el tablero por las bocas, con subida y bajada); verificalo en obra.`);
    return { ...c, largoEstimado: estimado, largoDesdePlano: desdePlano, resultado, error: undefined };
  } catch (e) {
    if (e instanceof ErrorCalculo) return { ...c, largoEstimado: estimado, largoDesdePlano: desdePlano, resultado: undefined, error: e.message };
    throw e;
  }
}

export function calcularCircuitosProyecto(p: Proyecto, norma: Norma = aea770): Proyecto {
  return { ...p, circuitos: p.circuitos.map((c) => calcularCircuitoDeProyecto(c, p, norma)) };
}

/** Asigna y calcula: lo que se corre al cambiar cualquier elemento. */
export function recalcularProyecto(p: Proyecto, norma: Norma = aea770): Proyecto {
  return calcularCircuitosProyecto(asignarCircuitos(podarPlano(p), norma), norma);
}
