import type { Fuente } from "../normas/tipos";
import { aea770, type TablasAea770 } from "../normas/aea770";
import type { Material, Paso, TipoCircuito } from "./tipos";

export type Norma = TablasAea770;
export { aea770 };

type FilaNormativa = { verificado: boolean; fuente: Fuente; nota?: string };

/** Advertencia estándar cuando se usa un valor que el usuario todavía no confirmó. */
export function avisoNoVerificado(fila: FilaNormativa, que: string): string | undefined {
  if (fila.verificado) return undefined;
  const f = fila.fuente;
  return `Valor sin verificar: ${que} (${f.norma}, ${f.referencia}${f.pagina ? `, pág. ${f.pagina}` : ""}).`;
}

export function agregarAviso(advertencias: string[], aviso: string | undefined): void {
  if (aviso && !advertencias.includes(aviso)) advertencias.push(aviso);
}

/** Número con coma decimal para los textos del paso a paso. */
export function fmt(n: number, decimales = 2): string {
  return n.toLocaleString("es-AR", { maximumFractionDigits: decimales, minimumFractionDigits: 0 });
}

export function redondear(n: number, decimales = 2): number {
  const k = 10 ** decimales;
  return Math.round(n * k) / k;
}

export type FilaResistividad = Norma["resistividades"]["filas"][number];
export type FilaIz = Norma["corrientesAdmisibles"]["filas"][number];

/** Primera resistividad cargada para el material (la del curso, hasta tener la de servicio). */
export function resistividadDe(material: Material, norma: Norma = aea770): FilaResistividad {
  const fila = norma.resistividades.filas.find((f) => f.material === material);
  if (!fila) throw new Error(`No hay resistividad cargada para ${material}.`);
  return fila;
}

export function seccionesConIz(metodo: string, material: Material, norma: Norma = aea770): FilaIz[] {
  return norma.corrientesAdmisibles.filas
    .filter((f) => f.metodo === metodo && f.material === material)
    .sort((a, b) => a.seccionMm2 - b.seccionMm2);
}

export function metodosDisponibles(norma: Norma = aea770): string[] {
  return [...new Set(norma.corrientesAdmisibles.filas.map((f) => f.metodo))];
}

const ILUMINACION: TipoCircuito[] = ["IUG", "IUE"];

/** Límite de caída de tensión (%) según el tipo de circuito (iluminación vs. otras cargas). */
export function limiteCaida(tipo: TipoCircuito | undefined, norma: Norma = aea770) {
  const prefijo = tipo && ILUMINACION.includes(tipo) ? "Iluminación" : "Otras cargas, servicio normal";
  const fila = norma.caidaTension.filas.find((f) => f.caso.startsWith(prefijo));
  if (!fila) throw new Error(`No hay límite de caída cargado para "${prefijo}".`);
  return fila;
}

export function paso(p: Paso): Paso {
  return p;
}
