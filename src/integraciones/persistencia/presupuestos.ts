import { datosPresupuestoNuevos, type DatosPresupuesto } from "@/dominio/computo/datos";
import { CONFIG_COMPUTO_POR_DEFECTO } from "@/dominio/computo/tipos";
import { db } from "./db";

/** Los datos guardados completan lo que falte con los valores por defecto (por si el modelo creció). */
export async function obtenerDatosPresupuesto(proyectoId: string): Promise<DatosPresupuesto> {
  const nuevo = datosPresupuestoNuevos(proyectoId);
  const guardado = await (await db()).get("presupuestos", proyectoId);
  return guardado ? { ...nuevo, ...guardado, config: { ...CONFIG_COMPUTO_POR_DEFECTO, ...guardado.config } } : nuevo;
}

export async function guardarDatosPresupuesto(d: DatosPresupuesto): Promise<void> {
  await (await db()).put("presupuestos", d);
}
