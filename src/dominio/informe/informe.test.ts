import { describe, expect, it } from "vitest";
import { recalcularProyecto } from "../circuitos/calcular";
import { calcularComputo } from "../computo/computo";
import { armarPresupuesto } from "../computo/presupuesto";
import { proyectoNuevo } from "../proyecto/tipos";
import { armarInforme, INSTALADOR_VACIO, type OpcionesInforme } from "./informe";

function proyecto() {
  const p = proyectoNuevo({ nombre: "Casa García", superficieM2: 70, sistema: "monofasico" }, "2026-01-01T00:00:00.000Z");
  p.ambientes = [{ id: "a", nombre: "Estar", tipo: "estar-comedor" }];
  p.elementos = [
    { id: "l1", tipo: "boca_luz", ambienteId: "a" },
    { id: "t1", tipo: "toma_general", ambienteId: "a" },
  ];
  return recalcularProyecto(p);
}

const opciones = (p = proyecto(), extra: Partial<OpcionesInforme> = {}): OpcionesInforme => ({
  version: "tecnica",
  instalador: { ...INSTALADOR_VACIO, nombre: "Juan Pérez", matricula: "123" },
  cliente: { nombre: "Ana García", direccion: "Calle 1", ciudad: "Rosario" },
  obra: { numeroInforme: "2026-001", fecha: "2026-10-07" },
  presupuesto: armarPresupuesto(calcularComputo(p), new Map(), { modo: "fijo", valor: 100 }, p),
  ...extra,
});

describe("armarInforme", () => {
  it("la versión técnica trae fichas con paso a paso, verificaciones y despiece", () => {
    const p = proyecto();
    const i = armarInforme(p, opciones(p));
    const ids = i.secciones.map((s) => s.id);
    expect(ids).toEqual(["objeto", "resumen", "circuitos", "consolidado", "unifilar", "verificaciones", "despiece", "presupuesto", "firmas"]);
    const fichas = i.secciones.find((s) => s.id === "circuitos")!;
    expect(fichas.id === "circuitos" && fichas.fichas.every((f) => f.pasos.length > 0)).toBe(true);
    expect(i.caratula.normativa).toMatch(/2017/);
    expect(i.pie).toBe("Casa García · Ana García");
  });

  it("la versión cliente es resumida y sin fórmulas", () => {
    const p = proyecto();
    const ids = armarInforme(p, opciones(p, { version: "cliente" })).secciones.map((s) => s.id);
    expect(ids).not.toContain("circuitos");
    expect(ids).not.toContain("verificaciones");
    expect(ids).not.toContain("despiece");
    expect(ids).toContain("presupuesto");
  });

  it("cada sección se puede desactivar", () => {
    const p = proyecto();
    const ids = armarInforme(p, opciones(p, { secciones: { unifilar: false, presupuesto: false, firmas: false } })).secciones.map((s) => s.id);
    expect(ids).not.toContain("unifilar");
    expect(ids).not.toContain("presupuesto");
    expect(ids).not.toContain("firmas");
  });

  it("el cuadro consolidado tiene una fila por circuito y el resumen suma la potencia", () => {
    const p = proyecto();
    const i = armarInforme(p, opciones(p));
    const c = i.secciones.find((s) => s.id === "consolidado")!;
    expect(c.id === "consolidado" && c.filas.map((f) => f.id)).toEqual(p.circuitos.map((x) => x.id));
    const r = i.secciones.find((s) => s.id === "resumen")!;
    expect(r.id === "resumen" && r.circuitos).toBe(p.circuitos.length);
    expect(r.id === "resumen" && r.potenciaTotalW).toBeCloseTo(p.circuitos.reduce((s, x) => s + x.resultado!.potenciaTotalW, 0));
  });

  it("avisa de ítems sin precio y de circuitos sin calcular", () => {
    const p = proyecto();
    p.circuitos[0] = { ...p.circuitos[0], resultado: undefined, error: "x" };
    const i = armarInforme(p, opciones(p));
    expect(i.avisos.join(" ")).toMatch(/sin precio/);
    expect(i.avisos.join(" ")).toMatch(/sin calcular/);
  });

  it("incluye la firma del instalador en la sección de firmas", () => {
    const p = proyecto();
    const i = armarInforme(p, opciones(p, { instalador: { ...INSTALADOR_VACIO, nombre: "Juan", firma: "data:image/png;base64,AAAA" } }));
    const f = i.secciones.find((s) => s.id === "firmas")!;
    expect(f.id === "firmas" && f.instalador.firma).toBe("data:image/png;base64,AAAA");
  });
});
