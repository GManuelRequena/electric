import { describe, expect, it } from "vitest";
import { aea770 } from "./index";

const tablas = Object.entries(aea770);

describe("tablas AEA 770", () => {
  it("todas las tablas validan su esquema (el import ya parsea)", () => {
    expect(tablas).toHaveLength(16);
    for (const [, t] of tablas) expect(t.id).toMatch(/^aea770\./);
  });

  it("ninguna fila carece de fuente", () => {
    for (const [nombre, t] of tablas) {
      for (const fila of t.filas) {
        const f = (fila as { fuente?: { referencia?: string; documento?: string } }).fuente;
        expect(f?.referencia, `${nombre}: fila sin referencia`).toBeTruthy();
        expect(f?.documento, `${nombre}: fila sin documento`).toBeTruthy();
      }
    }
  });

  it("informa cuántos valores siguen sin verificar", () => {
    const resumen = tablas.map(([nombre, t]) => {
      const filas = t.filas as { verificado: boolean }[];
      return `${nombre}: ${filas.filter((f) => !f.verificado).length}/${filas.length} filas sin verificar`;
    });
    console.info(`Pendientes de verificación:\n${resumen.join("\n")}`);
  });

  it("calibres normalizados: ascendentes y sin duplicados", () => {
    const a = aea770.calibresNormalizados.filas.map((f) => f.calibreA);
    expect(a).toEqual([...new Set(a)].sort((x, y) => x - y));
  });

  it("corrientes admisibles: Iz crece con la sección dentro de cada método", () => {
    const porMetodo = new Map<string, { s: number; i: number }[]>();
    for (const f of aea770.corrientesAdmisibles.filas) {
      const k = `${f.metodo}|${f.material}|${f.conductoresCargados}`;
      porMetodo.set(k, [...(porMetodo.get(k) ?? []), { s: f.seccionMm2, i: f.corrienteAdmisibleA }]);
    }
    for (const filas of porMetodo.values()) {
      const ord = [...filas].sort((a, b) => a.s - b.s);
      for (let k = 1; k < ord.length; k++) expect(ord[k].i).toBeGreaterThan(ord[k - 1].i);
    }
  });

  it("calibre máximo de protección no baja al aumentar la sección", () => {
    const f = aea770.calibresMaxProteccion.filas.filter((x) => x.circuitosPorCano === 1);
    const ord = [...f].sort((a, b) => a.seccionMm2 - b.seccionMm2);
    for (let k = 1; k < ord.length; k++) expect(ord[k].calibreMaxA).toBeGreaterThanOrEqual(ord[k - 1].calibreMaxA);
  });
});
