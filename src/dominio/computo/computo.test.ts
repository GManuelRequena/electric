import { describe, expect, it } from "vitest";
import { recalcularProyecto } from "../circuitos/calcular";
import { proyectoNuevo, type Elemento, type Proyecto, type TipoElemento } from "../proyecto/tipos";
import { armarPresupuesto, type Precio } from "./presupuesto";
import { calcularComputo, circuitosSinCalcular, modulosDeProtecciones } from "./computo";
import { codigoCable, itemDeCodigo, MODULOS_GABINETE } from "./materiales";
import { CONFIG_COMPUTO_POR_DEFECTO } from "./tipos";

let n = 0;
const el = (tipo: TipoElemento, extra: Partial<Elemento> = {}): Elemento => ({ id: `e${++n}`, tipo, ambienteId: "dor", ...extra });

function vivienda(elementos: Elemento[], ajustar: (p: Proyecto) => void = () => {}): Proyecto {
  const p = proyectoNuevo({ nombre: "Prueba", superficieM2: 70, sistema: "monofasico" }, "2026-01-01T00:00:00.000Z");
  p.ambientes = [{ id: "dor", nombre: "Dormitorio", tipo: "dormitorio" }];
  p.elementos = elementos;
  ajustar(p);
  const r = recalcularProyecto(p);
  r.circuitos = r.circuitos.map((c) => ({ ...c, largoM: 10 })); // largo cargado: no estimado
  return recalcularProyecto(r);
}

const cant = (lineas: { codigo: string; cantidad: number }[], codigo: string) => lineas.find((l) => l.codigo === codigo)?.cantidad ?? 0;

describe("calcularComputo", () => {
  it("circuito monofásico de 10 m con PE y 10 % de desperdicio: 3 × 10 × 1,1 = 33 m de la sección", () => {
    const p = vivienda([el("toma_general"), el("toma_general")]);
    const tug = p.circuitos.find((c) => c.tipo === "TUG")!;
    const s = tug.resultado!.seccionMm2;
    const lineas = calcularComputo(p, CONFIG_COMPUTO_POR_DEFECTO);
    const f = cant(lineas, codigoCable(s, "marron"));
    const nt = cant(lineas, codigoCable(s, "celeste"));
    const pe = cant(lineas, codigoCable(Math.max(s, 2.5), "verde_amarillo"));
    expect(s).toBe(2.5);
    expect(f + nt + pe).toBe(33);
    expect([f, nt, pe]).toEqual([11, 11, 11]);
  });

  it("sin puesta a tierra no hay conductor PE", () => {
    const p = vivienda([el("toma_general")], (x) => (x.tablero.puestaATierra = false));
    const lineas = calcularComputo(p);
    expect(lineas.some((l) => l.codigo.includes("VERDE_AMARILLO") || l.codigo === "JABALINA")).toBe(false);
  });

  it("una térmica por circuito (más la general)", () => {
    const p = vivienda([el("boca_luz"), el("toma_general"), el("toma_especial", {})]);
    const lineas = calcularComputo(p);
    const termicas1P = lineas.filter((l) => l.codigo.startsWith("TERMICA_1P_")).reduce((s, l) => s + l.cantidad, 0);
    expect(termicas1P).toBe(p.circuitos.filter((c) => c.resultado).length);
    expect(lineas.filter((l) => l.codigo.startsWith("TERMICA_2P_"))).toHaveLength(1);
  });

  it("los módulos del gabinete cubren las protecciones", () => {
    const p = vivienda([el("boca_luz"), el("toma_general")]);
    const lineas = calcularComputo(p);
    const gab = lineas.find((l) => l.codigo.startsWith("GABINETE_"))!;
    const modulos = Number(/GABINETE_(\d+)M/.exec(gab.codigo)![1]);
    expect(MODULOS_GABINETE).toContain(modulos);
    expect(modulos).toBeGreaterThanOrEqual(modulosDeProtecciones(lineas));
  });

  it("cajas y mecanismos según el tipo de elemento", () => {
    const p = vivienda([el("boca_luz"), el("tecla_doble"), el("tecla_combinacion"), el("toma_general"), el("toma_especial")]);
    const lineas = calcularComputo(p);
    expect(cant(lineas, "CAJA_OCTOGONAL")).toBe(1);
    expect(cant(lineas, "CAJA_RECTANGULAR")).toBe(4);
    expect(cant(lineas, "MOD_TECLA")).toBe(2);
    expect(cant(lineas, "MOD_TECLA_COMBINACION")).toBe(1);
    expect(cant(lineas, "MOD_TOMA_10A")).toBe(1);
    expect(cant(lineas, "MOD_TOMA_20A")).toBe(1);
    expect(cant(lineas, "BASTIDOR")).toBe(4);
    expect(cant(lineas, "TAPA")).toBe(4);
  });

  it("un artefacto enchufado no suma caja", () => {
    const toma = el("toma_general");
    const art = el("artefacto", { enchufadoEn: toma.id, artefacto: { id: "a", nombre: "Pava", potenciaW: 2000, cosPhi: 1, cantidad: 1, simultaneo: true } });
    const lineas = calcularComputo(vivienda([toma, art]));
    expect(cant(lineas, "CAJA_RECTANGULAR")).toBe(1);
  });

  it("cada línea se rastrea hasta los circuitos o elementos que la generan", () => {
    const p = vivienda([el("boca_luz"), el("toma_general")]);
    const lineas = calcularComputo(p);
    const ids = new Set([...p.circuitos.map((c) => c.id), ...p.elementos.map((e) => e.id), "tablero", "puesta_a_tierra"]);
    for (const l of lineas) {
      expect(l.origen.length).toBeGreaterThan(0);
      expect(l.origen.every((o) => ids.has(o))).toBe(true);
    }
  });

  it("marca como estimadas las líneas que dependen de un largo estimado", () => {
    const p = recalcularProyecto({ ...vivienda([el("toma_general")]), circuitos: [] });
    const lineas = calcularComputo(p);
    const tug = p.circuitos[0];
    expect(tug.largoEstimado).toBe(true);
    expect(lineas.find((l) => l.codigo === codigoCable(tug.resultado!.seccionMm2, "marron"))!.estimado).toBe(true);
  });

  it("es determinista y todos los códigos existen en el catálogo", () => {
    const p = vivienda([el("boca_luz"), el("tecla_simple"), el("toma_general")]);
    expect(calcularComputo(p)).toEqual(calcularComputo(p));
    for (const l of calcularComputo(p)) expect(itemDeCodigo(l.codigo), l.codigo).toBeDefined();
  });

  it("informa los circuitos que no se pudieron calcular", () => {
    const p = vivienda([el("toma_general")]);
    p.circuitos[0] = { ...p.circuitos[0], resultado: undefined, error: "x" };
    expect(circuitosSinCalcular(p)).toEqual([p.circuitos[0].id]);
  });
});

describe("armarPresupuesto", () => {
  const precio = (codigo: string, precioUnitario: number, moneda: Precio["moneda"] = "ARS"): Precio => ({ codigo, precioUnitario, moneda, fecha: "2026-10-01", proveedor: "Manual" });

  it("las líneas sin precio van a sinPrecio y no rompen el total", () => {
    const p = vivienda([el("boca_luz"), el("toma_general")]);
    const lineas = calcularComputo(p);
    const caja = lineas.find((l) => l.codigo === "CAJA_OCTOGONAL")!;
    const r = armarPresupuesto(lineas, new Map([[caja.codigo, precio(caja.codigo, 100)]]), { modo: "fijo", valor: 0 }, p);
    expect(r.sinPrecio).toHaveLength(lineas.length - 1);
    expect(r.sinPrecio).not.toContain("CAJA_OCTOGONAL");
    expect(r.materiales).toBe(100 * caja.cantidad);
    expect(r.total).toBe(r.materiales);
  });

  it("al cargar un precio el total se actualiza", () => {
    const p = vivienda([el("boca_luz")]);
    const lineas = calcularComputo(p);
    const a = armarPresupuesto(lineas, new Map(), { modo: "fijo", valor: 0 }, p);
    const b = armarPresupuesto(lineas, new Map([["JABALINA", precio("JABALINA", 5000)]]), { modo: "fijo", valor: 0 }, p);
    expect(a.total).toBe(0);
    expect(b.total).toBe(5000);
  });

  it("mano de obra por boca, por hora y fija", () => {
    const p = vivienda([el("boca_luz"), el("boca_luz"), el("tecla_simple"), el("toma_general")]);
    const l = calcularComputo(p);
    expect(armarPresupuesto(l, new Map(), { modo: "por_boca", valor: 1000 }, p).manoDeObra).toBe(3000); // la tecla no es boca
    expect(armarPresupuesto(l, new Map(), { modo: "por_hora", valor: 500, horas: 8 }, p).manoDeObra).toBe(4000);
    expect(armarPresupuesto(l, new Map(), { modo: "fijo", valor: 90000 }, p).total).toBe(90000);
  });

  it("USD sin cotización cuenta como sin precio; con cotización se convierte", () => {
    const p = vivienda([el("boca_luz")]);
    const l = calcularComputo(p);
    const precios = new Map([["JABALINA", precio("JABALINA", 10, "USD")]]);
    const mo = { modo: "fijo", valor: 0 } as const;
    expect(armarPresupuesto(l, precios, mo, p).sinPrecio).toContain("JABALINA");
    expect(armarPresupuesto(l, precios, mo, p, { cotizacionUsd: 1000 }).materiales).toBe(10000);
  });
});
