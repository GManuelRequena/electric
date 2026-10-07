import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { recalcularProyecto } from "@/dominio/circuitos/calcular";
import { exportarProyecto, importarProyecto } from "@/dominio/proyecto/esquema";
import { proyectoNuevo } from "@/dominio/proyecto/tipos";
import { borrarProyecto, guardarProyecto, listarProyectos, obtenerProyecto } from "./proyectos";

function ejemplo() {
  const p = proyectoNuevo({ nombre: "Casa", superficieM2: 70, sistema: "monofasico" });
  p.ambientes = [{ id: "a", nombre: "Estar", tipo: "estar-comedor", superficieM2: 20 }];
  p.elementos = [
    { id: "l", tipo: "boca_luz", ambienteId: "a" },
    { id: "t", tipo: "toma_general", ambienteId: "a" },
  ];
  return recalcularProyecto(p);
}

describe("persistencia de proyectos", () => {
  beforeEach(async () => {
    for (const p of await listarProyectos()) await borrarProyecto(p.id);
  });

  it("guarda, lista, lee y borra", async () => {
    const p = ejemplo();
    await guardarProyecto(p);
    expect((await obtenerProyecto(p.id))?.nombre).toBe("Casa");
    expect((await listarProyectos()).map((x) => x.id)).toEqual([p.id]);
    await borrarProyecto(p.id);
    expect(await obtenerProyecto(p.id)).toBeUndefined();
  });

  it("lista primero el más reciente", async () => {
    const a = { ...ejemplo(), id: "a", actualizado: "2026-01-01T00:00:00.000Z" };
    const b = { ...ejemplo(), id: "b", actualizado: "2026-02-01T00:00:00.000Z" };
    await guardarProyecto(a);
    await guardarProyecto(b);
    expect((await listarProyectos()).map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("exportar e importar JSON", () => {
  it("hace ida y vuelta con un id nuevo y los mismos datos", () => {
    const p = ejemplo();
    const r = importarProyecto(exportarProyecto(p));
    if ("error" in r) throw new Error(r.error);
    expect(r.proyecto.id).not.toBe(p.id);
    expect(r.proyecto.elementos).toEqual(p.elementos);
    expect(recalcularProyecto(r.proyecto).circuitos.map((c) => c.resultado?.termicaA)).toEqual(p.circuitos.map((c) => c.resultado?.termicaA));
  });

  it("rechaza archivos inválidos con un mensaje", () => {
    expect(importarProyecto("{no json")).toEqual({ error: "El archivo no es un JSON válido." });
    expect(importarProyecto('{"a":1}')).toHaveProperty("error");
    expect(importarProyecto(JSON.stringify({ formato: "electricista-proyecto", proyecto: { id: "x" } }))).toHaveProperty("error");
  });
});
