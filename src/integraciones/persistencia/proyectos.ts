import type { Proyecto } from "@/dominio/proyecto/tipos";
import { _reiniciar, db } from "./db";

export { _reiniciar };

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
