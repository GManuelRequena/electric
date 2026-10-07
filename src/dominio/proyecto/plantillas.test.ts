import { describe, expect, it } from "vitest";
import { PLANTILLAS, proyectoDesdePlantilla, superficiePlantilla } from "./plantillas";
import { exportarProyecto, importarProyecto } from "./esquema";

describe("plantillas de proyecto", () => {
  it("cada plantilla genera un proyecto válido con ambientes de ids únicos", () => {
    for (const pl of PLANTILLAS) {
      const p = proyectoDesdePlantilla(pl, { nombre: pl.nombre, superficieM2: superficiePlantilla(pl), sistema: "monofasico" });
      expect(p.ambientes).toHaveLength(pl.ambientes.length);
      expect(new Set(p.ambientes.map((a) => a.id)).size).toBe(p.ambientes.length);
      expect(p.elementos).toEqual([]);
      const r = importarProyecto(exportarProyecto(p));
      expect("error" in r).toBe(false);
    }
  });
  it("dos proyectos de la misma plantilla no comparten ids", () => {
    const pl = PLANTILLAS[0];
    const datos = { nombre: "x", superficieM2: 30, sistema: "monofasico" as const };
    const a = proyectoDesdePlantilla(pl, datos);
    const b = proyectoDesdePlantilla(pl, datos);
    expect(a.ambientes[0].id).not.toBe(b.ambientes[0].id);
  });
});
