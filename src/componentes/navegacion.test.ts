import { describe, expect, it } from "vitest";
import { ACCION_CENTRAL, ITEMS_NAV, estaActivo } from "./navegacion";

describe("estaActivo", () => {
  it("marca la sección y sus subrutas", () => {
    expect(estaActivo("/calcular", "/calcular")).toBe(true);
    expect(estaActivo("/calcular/rapida", "/calcular")).toBe(true);
  });

  it("no confunde rutas que solo comparten prefijo", () => {
    expect(estaActivo("/calcularx", "/calcular")).toBe(false);
    expect(estaActivo("/proyectos", "/calcular")).toBe(false);
  });
});

describe("navegación", () => {
  it("tiene 4 secciones y una acción central que no repite ninguna", () => {
    expect(ITEMS_NAV).toHaveLength(4);
    expect(ITEMS_NAV.map((i) => i.href)).not.toContain(ACCION_CENTRAL.href);
  });
});
