import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Precio } from "@/dominio/computo/presupuesto";
import type { DatosPresupuesto } from "@/dominio/computo/datos";
import type { Proyecto } from "@/dominio/proyecto/tipos";

interface Esquema extends DBSchema {
  proyectos: { key: string; value: Proyecto; indexes: { porActualizado: string } };
  precios: { key: string; value: Precio };
  presupuestos: { key: string; value: DatosPresupuesto };
}

let abierta: Promise<IDBPDatabase<Esquema>> | undefined;

/** Una sola base "electricista"; la versión 2 suma precios y datos de presupuesto sin tocar los proyectos. */
export function db() {
  abierta ??= openDB<Esquema>("electricista", 2, {
    upgrade(d, versionPrevia) {
      if (versionPrevia < 1) d.createObjectStore("proyectos", { keyPath: "id" }).createIndex("porActualizado", "actualizado");
      if (versionPrevia < 2) {
        d.createObjectStore("precios", { keyPath: "codigo" });
        d.createObjectStore("presupuestos", { keyPath: "proyectoId" });
      }
    },
  });
  return abierta;
}

/** Solo para los tests: fuerza a reabrir la base. */
export function _reiniciar(): void {
  abierta = undefined;
}
