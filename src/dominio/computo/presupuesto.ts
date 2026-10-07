import { redondear } from "../calculo/util";
import { esBoca } from "../circuitos/largo";
import type { Proyecto } from "../proyecto/tipos";
import { itemDeCodigo } from "./materiales";
import type { ItemMaterial, LineaComputo } from "./tipos";

export interface Precio {
  codigo: string;
  /** Por unidad del ítem (metro, unidad). */
  precioUnitario: number;
  moneda: "ARS" | "USD";
  /** AAAA-MM-DD. */
  fecha: string;
  proveedor: string;
  url?: string;
}

export interface ManoDeObra {
  modo: "por_boca" | "por_hora" | "fijo";
  valor: number;
  horas?: number;
}

export interface LineaPresupuesto extends LineaComputo {
  item?: ItemMaterial;
  precio?: Precio;
  /** Precio unitario en ARS (convertido si estaba en USD). */
  precioUnitarioArs?: number;
  subtotal?: number;
}

export interface Presupuesto {
  lineas: LineaPresupuesto[];
  /** Códigos sin precio cargado (o en USD sin cotización). No suman al total. */
  sinPrecio: string[];
  materiales: number;
  manoDeObra: number;
  total: number;
}

export interface OpcionesPresupuesto {
  /** Pesos por dólar. Sin esto, los precios en USD cuentan como "sin precio". */
  cotizacionUsd?: number;
}

export function costoManoDeObra(mo: ManoDeObra, p: Proyecto): number {
  const valor = Number.isFinite(mo.valor) && mo.valor > 0 ? mo.valor : 0;
  if (mo.modo === "por_boca") return valor * p.elementos.filter(esBoca).length;
  if (mo.modo === "por_hora") return valor * Math.max(0, mo.horas ?? 0);
  return valor;
}

export function armarPresupuesto(c: LineaComputo[], precios: Map<string, Precio>, mo: ManoDeObra, p: Proyecto, opciones: OpcionesPresupuesto = {}): Presupuesto {
  const sinPrecio: string[] = [];
  const lineas = c.map<LineaPresupuesto>((l) => {
    const item = itemDeCodigo(l.codigo);
    const precio = precios.get(l.codigo);
    const unitario = precio && (precio.moneda === "ARS" ? precio.precioUnitario : opciones.cotizacionUsd ? precio.precioUnitario * opciones.cotizacionUsd : undefined);
    if (!precio || unitario == null) {
      sinPrecio.push(l.codigo);
      return { ...l, item, precio };
    }
    return { ...l, item, precio, precioUnitarioArs: unitario, subtotal: redondear(l.cantidad * unitario) };
  });
  const materiales = redondear(lineas.reduce((s, l) => s + (l.subtotal ?? 0), 0));
  const manoDeObra = redondear(costoManoDeObra(mo, p));
  return { lineas, sinPrecio, materiales, manoDeObra, total: redondear(materiales + manoDeObra) };
}
