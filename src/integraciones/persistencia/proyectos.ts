import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Proyecto } from "@/dominio/proyecto/tipos";

interface Esquema extends DBSchema {
  proyectos: { key: string; value: Proyecto; indexes: { porActualizado: string } };
}

let abierta: Promise<IDBPDatabase<Esquema>> | undefined;

function db() {
  abierta ??= openDB<Esquema>("electricista", 1, {
    upgrade(d) {
      d.createObjectStore("proyectos", { keyPath: "id" }).createIndex("porActualizado", "actualizado");
    },
  });
  return abierta;
}

/** Solo para los tests: fuerza a reabrir la base. */
export function _reiniciar(): void {
  abierta = undefined;
}

export async function listarProyectos(): Promise<Proyecto[]> {
  return (await (await db()).getAllFromIndex("proyectos", "porActualizado")).reverse();
}

export async function obtenerProyecto(id: string): Promise<Proyecto | undefined> {
  return (await db()).get("proyectos", id);
}

export async function guardarProyecto(p: Proyecto): Promise<void> {
  await (await db()).put("proyectos", p);
}

export async function borrarProyecto(id: string): Promise<void> {
  await (await db()).delete("proyectos", id);
}
