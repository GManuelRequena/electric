import { describe, expect, it } from "vitest";
import {
  aea770,
  calcularCircuito,
  calcularVivienda,
  caidaTension,
  corrienteDesdePotencia,
  elegirSeccion,
  elegirTermica,
  largoMaximo,
  seccionMinimaPorCaida,
  sugerirCurva,
  tablaCaidaPorSeccion,
} from "./index";

const METODO = "canerias-embutidas-o-a-la-vista-40C-3-cables";

describe("corrienteDesdePotencia", () => {
  it("monofásico: 2200 W / (220 · 1) = 10 A", () => {
    expect(corrienteDesdePotencia(2200, 220, 1, "monofasico")).toBeCloseTo(10, 9);
  });
  it("monofásico con cos φ 0,8: 1760 / (220 · 0,8) = 10 A", () => {
    expect(corrienteDesdePotencia(1760, 220, 0.8, "monofasico")).toBeCloseTo(10, 9);
  });
  it("trifásico: 6580 W a 380 V, cos φ 1 → 6580 / (1,7320508 · 380) ≈ 10 A", () => {
    expect(corrienteDesdePotencia(6581.79, 380, 1, "trifasico")).toBeCloseTo(10, 3);
  });
  it("rechaza cos φ inválido", () => {
    expect(() => corrienteDesdePotencia(100, 220, 0, "monofasico")).toThrow();
    expect(() => corrienteDesdePotencia(100, 220, 1.2, "monofasico")).toThrow();
  });
});

describe("caída de tensión", () => {
  const base = { corrienteA: 10, largoM: 20, resistividadOhmMm2PorM: 0.0175, sistema: "monofasico" as const, cosPhi: 1, tensionV: 220 };
  it("monofásica: 2 · 20 · 10 · 0,0175 / 2,5 = 2,8 V = 1,2727 %", () => {
    const r = caidaTension({ ...base, seccionMm2: 2.5 });
    expect(r.volts).toBeCloseTo(2.8, 9);
    expect(r.pct).toBeCloseTo(1.2727, 4);
  });
  it("trifásica: √3 · 20 · 10 · 0,0175 / 2,5 sobre 380 V", () => {
    const r = caidaTension({ ...base, sistema: "trifasico", tensionV: 380, seccionMm2: 2.5 });
    expect(r.volts).toBeCloseTo(2.4249, 4);
    expect(r.pct).toBeCloseTo(0.6381, 4);
  });
  it("la sección menor da más caída y cos φ la reduce", () => {
    expect(caidaTension({ ...base, seccionMm2: 1.5 }).volts).toBeGreaterThan(caidaTension({ ...base, seccionMm2: 2.5 }).volts);
    expect(caidaTension({ ...base, seccionMm2: 2.5, cosPhi: 0.8 }).volts).toBeCloseTo(2.24, 9);
  });
  it("tabla, sección mínima y largo máximo son coherentes", () => {
    const secciones = [1.5, 2.5, 4, 6];
    const e = { ...base, largoM: 40 };
    const tabla = tablaCaidaPorSeccion(e, secciones, 3);
    // 2·40·10·0,0175 = 14 → 14/S: 9,33 V (4,24 %), 5,6 V (2,55 %), 3,5 V, 2,33 V
    expect(tabla.map((f) => f.cumple)).toEqual([false, true, true, true]);
    expect(seccionMinimaPorCaida(e, secciones, 3)).toBe(2.5);
    const l = largoMaximo({ ...base, seccionMm2: 2.5 }, 3); // 3 % de 220 = 6,6 V → L = 6,6 · 2,5 / (2 · 10 · 0,0175)
    expect(l).toBeCloseTo(47.142857, 5);
    expect(seccionMinimaPorCaida({ ...e, largoM: 1000 }, secciones, 3)).toBeUndefined();
  });
});

describe("elegirTermica", () => {
  it("elige el menor In normalizado ≥ Ib", () => {
    const r = elegirTermica(15.9, 18);
    expect("inA" in r && r.inA).toBe(16);
    const r2 = elegirTermica(16, 25);
    expect("inA" in r2 && r2.inA).toBe(16);
  });
  it("error si el menor calibre ≥ Ib supera Iz", () => {
    expect("error" in elegirTermica(17, 18)).toBe(true); // 20 A > 18 A
  });
  it("error si no existe calibre ≥ Ib", () => {
    expect("error" in elegirTermica(100, 200)).toBe(true);
  });
});

describe("elegirSeccion", () => {
  const caida = { corrienteA: 15.909, largoM: 55, resistividadOhmMm2PorM: 0.0175, sistema: "monofasico" as const, cosPhi: 1, tensionV: 220, limitePct: 5 };
  it("mínima de la norma", () => {
    const r = elegirSeccion({ ibA: 5, minimaMm2: 2.5, metodoInstalacion: METODO, material: "cobre" });
    expect("error" in r ? null : [r.seccionMm2, r.motivo]).toEqual([2.5, "minima_norma"]);
  });
  it("por corriente", () => {
    const r = elegirSeccion({ ibA: 17.3, minimaMm2: 1.5, metodoInstalacion: METODO, material: "cobre" });
    expect("error" in r ? null : [r.seccionMm2, r.motivo, r.inA]).toEqual([4, "corriente", 20]);
  });
  it("por caída de tensión", () => {
    const r = elegirSeccion({ ibA: 15.909, minimaMm2: 2.5, metodoInstalacion: METODO, material: "cobre", caida });
    expect("error" in r ? null : [r.seccionMm2, r.motivo]).toEqual([4, "caida_tension"]);
  });
  it("respeta el calibre máximo del tipo de circuito", () => {
    const r = elegirSeccion({ ibA: 17.3, minimaMm2: 2.5, metodoInstalacion: METODO, material: "cobre", calibreMaxTipoA: 16 });
    expect("error" in r).toBe(true);
  });
  it("error para un material sin tabla", () => {
    expect("error" in elegirSeccion({ ibA: 5, minimaMm2: 1.5, metodoInstalacion: METODO, material: "aluminio" })).toBe(true);
  });
});

describe("calcularCircuito", () => {
  const horno = { id: "h", nombre: "Horno", potenciaW: 2000, cantidad: 1, simultaneo: true, requiereCircuitoPropio: true };
  const luz = { id: "l", nombre: "Luz", potenciaW: 100, cantidad: 2, simultaneo: true, categoria: "iluminacion" as const };
  const base = { sistema: "monofasico" as const, tensionV: 220, metodoInstalacion: METODO, material: "cobre" as const };

  it("marca artefactosConCircuitoPropio cuando hay más de un artefacto", () => {
    const r = calcularCircuito({ ...base, artefactos: [horno, luz] });
    expect(r.artefactosConCircuitoPropio).toEqual(["h"]);
    expect(r.cumple).toBe(false);
  });
  it("no marca nada con un solo artefacto", () => {
    expect(calcularCircuito({ ...base, artefactos: [horno] }).artefactosConCircuitoPropio).toEqual([]);
  });
  it("propaga advertencias de valores verificado:false y avisa si falta el largo", () => {
    const r = calcularCircuito({ ...base, artefactos: [luz] });
    expect(r.advertencias.some((a) => a.startsWith("Valor sin verificar"))).toBe(true);
    expect(r.advertencias.some((a) => a.includes("largo"))).toBe(true);
    expect(r.caidaTensionPct).toBeUndefined();
  });
  it("cada paso con valor normativo trae su fuente", () => {
    const r = calcularCircuito({ ...base, artefactos: [horno], largoM: 10 });
    const conFuente = r.pasos.filter((p) => p.fuente);
    expect(conFuente.length).toBeGreaterThanOrEqual(4);
  });
  it("reserva y artefacto por corriente", () => {
    const r = calcularCircuito({ ...base, artefactos: [{ id: "x", nombre: "X", corrienteA: 10, cantidad: 1, simultaneo: true }], reservaPct: 10 });
    expect(r.corrienteProyectoA).toBeCloseTo(11, 6);
  });
  it("tensión en el origen: estima la tensión en el extremo", () => {
    const r = calcularCircuito({ ...base, artefactos: [horno], largoM: 10, tensionOrigenV: 215 });
    expect(r.tensionExtremoV).toBeCloseTo(215 - r.caidaTensionV!, 2);
  });
  it("sugerirCurva: B iluminación, C tomas", () => {
    expect(sugerirCurva("IUG").curva).toBe("B");
    expect(sugerirCurva("TUG").curva).toBe("C");
    expect(sugerirCurva("TUE").curva).toBe("C");
  });
});

describe("calcularVivienda", () => {
  it("grado por superficie: 96 m² (94 + 50 % de 4) → medio", () => {
    const r = calcularVivienda({ superficieM2: 94, superficieSemicubiertaM2: 4, ambientes: [] });
    expect(r.superficieLimiteM2).toBe(96);
    expect(r.grado).toBe("medio");
  });
  it("otros grados", () => {
    expect(calcularVivienda({ superficieM2: 40, ambientes: [] }).grado).toBe("minimo");
    expect(calcularVivienda({ superficieM2: 150, ambientes: [] }).grado).toBe("elevado");
    expect(calcularVivienda({ superficieM2: 250, ambientes: [] }).grado).toBe("superior");
  });
  it("bocas del estar-comedor de 24 m² en grado medio: IUG ⌈24/18⌉ = 2, TUG ⌈24/6⌉ = 4 (ejemplo de la Guía)", () => {
    const r = calcularVivienda({ superficieM2: 96, ambientes: [{ tipo: "estar-comedor", cantidad: 1, superficieM2: 24 }] });
    expect(r.bocasPorAmbiente[0]).toMatchObject({ tipo: "estar-comedor", iluminacion: 2, tomas: 4, especiales: 0 });
  });
  it("pasillo de 5,5 m: 2 bocas de cada una", () => {
    const r = calcularVivienda({ superficieM2: 96, ambientes: [{ tipo: "pasillo", cantidad: 1, largoM: 5.5 }] });
    expect(r.bocasPorAmbiente[0]).toMatchObject({ iluminacion: 2, tomas: 2 });
  });
  it("avisa los pendientes (circuitos mínimos, ambientes sin reglas)", () => {
    const r = calcularVivienda({ superficieM2: 96, ambientes: [{ tipo: "garage", cantidad: 1 }] });
    expect(r.advertencias.some((a) => a.includes("Tabla 770.7.II"))).toBe(true);
    expect(r.advertencias.some((a) => a.includes("garage"))).toBe(true);
  });
  it("usa tablas que existen", () => {
    expect(aea770.gradosElectrificacion.filas).toHaveLength(4);
  });
});
