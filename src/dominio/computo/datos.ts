import type { ManoDeObra } from "./presupuesto";
import { CONFIG_COMPUTO_POR_DEFECTO, type ConfigComputo } from "./tipos";

/** Lo que se guarda aparte del proyecto para armar su presupuesto e informe. */
export interface DatosPresupuesto {
  proyectoId: string;
  manoDeObra: ManoDeObra;
  config: ConfigComputo;
  /** Pesos por dólar, para los precios en USD. */
  cotizacionUsd?: number;
  cliente: { nombre: string; direccion: string; ciudad: string };
  obra: { numeroInforme: string; fecha: string };
  validezDias: number;
  condicionesPago: string;
  observaciones: string;
}

export function datosPresupuestoNuevos(proyectoId: string, hoy = new Date().toISOString().slice(0, 10)): DatosPresupuesto {
  return {
    proyectoId,
    manoDeObra: { modo: "fijo", valor: 0 },
    config: CONFIG_COMPUTO_POR_DEFECTO,
    cliente: { nombre: "", direccion: "", ciudad: "" },
    obra: { numeroInforme: "", fecha: hoy },
    validezDias: 15,
    condicionesPago: "",
    observaciones: "",
  };
}
