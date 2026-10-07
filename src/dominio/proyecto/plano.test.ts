import { describe, expect, it } from "vitest";
import { proyectoNuevo, type Proyecto } from "./tipos";
import { ajustarARejilla, limitesPlano, podarPlano, rectPorDefecto } from "./plano";

function base(): Proyecto {
  const p = proyectoNuevo({ nombre: "P", superficieM2: 50, sistema: "monofasico" }, "2026-01-01T00:00:00.000Z");
  p.ambientes = [
    { id: "a", nombre: "Cocina", tipo: "cocina", superficieM2: 12 },
    { id: "b", nombre: "Dormitorio", tipo: "dormitorio" },
  ];
  return p;
}

describe("plano: helpers", () => {
  it("ajusta a la rejilla de 0,1 m", () => {
    expect(ajustarARejilla(1.234)).toBe(1.2);
    expect(ajustarARejilla(-0.01)).toBe(0);
  });

  it("rect por defecto: 4:3 según superficie, o 3 × 3, a la derecha de lo dibujado", () => {
    const p = base();
    const a = rectPorDefecto(p, "a");
    expect(a).toMatchObject({ x: 0, y: 0, anchoM: 4, altoM: 3 });
    p.plano = { ambientes: [a], posiciones: {} };
    expect(rectPorDefecto(p, "b")).toMatchObject({ x: 4.5, anchoM: 3, altoM: 3 });
  });

  it("límites: vacío da una caja por defecto y con datos cubre todo", () => {
    expect(limitesPlano(undefined).maxX).toBeGreaterThan(0);
    const l = limitesPlano({ ambientes: [{ ambienteId: "a", x: 1, y: 2, anchoM: 4, altoM: 3 }], posiciones: { z: { x: 9, y: 0 } }, tablero: { x: 0, y: 0 } });
    expect(l).toEqual({ minX: 0, minY: 0, maxX: 9, maxY: 5 });
  });

  it("poda lo que ya no existe", () => {
    const p = base();
    p.elementos = [
      { id: "l", tipo: "boca_luz", ambienteId: "a" },
      { id: "t", tipo: "tecla_simple", ambienteId: "a" },
    ];
    p.plano = {
      ambientes: [
        { ambienteId: "a", x: 0, y: 0, anchoM: 3, altoM: 3 },
        { ambienteId: "borrado", x: 4, y: 0, anchoM: 3, altoM: 3 },
      ],
      posiciones: { l: { x: 1, y: 1 }, t: { x: 1, y: 1 }, fantasma: { x: 2, y: 2 } },
    };
    const r = podarPlano(p).plano!;
    expect(r.ambientes.map((x) => x.ambienteId)).toEqual(["a"]);
    expect(Object.keys(r.posiciones)).toEqual(["l"]);
  });
});
