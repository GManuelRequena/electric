// REVISAR_USUARIO: casos típicos de vivienda con la cuenta hecha a mano. Verificá cada resultado antes de darlos por buenos.
//
// Datos y fórmulas comunes (todos con tensión nominal 220 V mono / 380 V tri, cobre, cañería embutida, 40 °C):
//  - Corriente: Ib = P / (U · cos φ) mono; Ib = P / (√3 · U · cos φ) tri (Módulo 2 del curso).
//  - Térmica: menor In normalizado (6, 10, 16, 20, 25, 32, 40, 50, 63 A) con Ib ≤ In ≤ Iz.
//  - Iz (Tabla 45 del curso, Módulo 4): 1,5 mm² → 14 A; 2,5 → 18 A; 4 → 25 A; 6 → 32 A. (Valores del curso, verificado:false.)
//  - Sección mínima (Guía AEA 770, p. 41): IUG 1,5 mm²; TUG y TUE 2,5 mm². Para ACU no hay dato (se usa 1,5, PENDIENTE).
//  - Caída (Módulo 4, p. 342): ΔU = 2 · L · I · ρ / S (mono) con ρ = 0,0175 Ω·mm²/m; trifásica √3 en lugar de 2.
//  - Límites de caída (Guía, 770.15.6): 3 % iluminación, 5 % otras cargas.
import { describe, expect, it } from "vitest";
import { calcularCircuito, ErrorCalculo, type Artefacto, type EntradaCircuito } from "./index";

const METODO = "canerias-embutidas-o-a-la-vista-40C-3-cables";

function art(p: Partial<Artefacto> & { nombre: string }): Artefacto {
  return { id: p.nombre, cantidad: 1, simultaneo: true, ...p };
}
function entrada(artefactos: Artefacto[], extra: Partial<EntradaCircuito> = {}): EntradaCircuito {
  return { sistema: "monofasico", tensionV: 220, artefactos, metodoInstalacion: METODO, material: "cobre", ...extra };
}

describe("casos de referencia (calculados a mano)", () => {
  it("1. Ducha 3500 W a 10 m", () => {
    // Ib = 3500 / 220 = 15,909 A. Consumo unitario > 10 A → TUE (Guía p. 23).
    // In: menor ≥ 15,909 → 16 A. Iz(1,5) = 14 < 16; Iz(2,5) = 18 ≥ 16 → 2,5 mm² (también es la mínima de TUE).
    // ΔU = 2 · 10 · 15,909 · 0,0175 / 2,5 = 2,227 V → 2,227 / 220 = 1,01 % ≤ 5 %. Curva C. Diferencial 30 mA.
    const r = calcularCircuito(entrada([art({ nombre: "Ducha", potenciaW: 3500, requiereCircuitoPropio: true })], { largoM: 10 }));
    expect(r.corrienteProyectoA).toBeCloseTo(15.909, 3);
    expect(r.tipoCircuitoSugerido).toBe("TUE");
    expect(r.termicaA).toBe(16);
    expect(r.seccionMm2).toBe(2.5);
    expect(r.motivoSeccion).toBe("minima_norma");
    expect(r.caidaTensionV).toBeCloseTo(2.227, 3);
    expect(r.caidaTensionPct).toBeCloseTo(1.012, 3);
    expect(r.curva).toBe("C");
    expect(r.diferencial).toEqual({ sensibilidadMa: 30, obligatorio: true });
    expect(r.cumple).toBe(true);
  });

  it("2. Ducha 3500 W a 55 m: la caída obliga a subir de sección", () => {
    // Con 2,5 mm²: ΔU = 2 · 55 · 15,909 · 0,0175 / 2,5 = 12,250 V → 5,57 % > 5 % ✗.
    // Con 4 mm²:   ΔU = 2 · 55 · 15,909 · 0,0175 / 4   =  7,656 V → 3,48 % ≤ 5 % ✓. Iz(4) = 25 A ≥ In = 16 A.
    const r = calcularCircuito(entrada([art({ nombre: "Ducha", potenciaW: 3500, requiereCircuitoPropio: true })], { largoM: 55 }));
    expect(r.seccionMm2).toBe(4);
    expect(r.motivoSeccion).toBe("caida_tension");
    expect(r.corrienteAdmisibleA).toBe(25);
    expect(r.termicaA).toBe(16);
    expect(r.caidaTensionV).toBeCloseTo(7.656, 3);
    expect(r.caidaTensionPct).toBeCloseTo(3.48, 2);
    expect(r.pasos.some((p) => p.titulo.startsWith("Ajuste de sección") && p.detalle.includes("5,57"))).toBe(true);
  });

  it("3. Tomacorrientes de cocina (TUG, 2200 VA) a 15 m", () => {
    // Ib = 2200 / 220 = 10 A (≤ 10 A por consumo unitario → TUG). In = 10 A (≥ Ib). Iz(1,5) = 14 ≥ 10,
    // pero la mínima de TUG es 2,5 mm² → 2,5 mm², motivo "mínima de la norma".
    // ΔU = 2 · 15 · 10 · 0,0175 / 2,5 = 2,1 V → 0,95 %.
    const r = calcularCircuito(entrada([art({ nombre: "Tomas cocina", potenciaW: 2200, categoria: "toma" })], { largoM: 15 }));
    expect(r.corrienteProyectoA).toBeCloseTo(10, 6);
    expect(r.tipoCircuitoSugerido).toBe("TUG");
    expect(r.termicaA).toBe(10);
    expect(r.seccionMm2).toBe(2.5);
    expect(r.motivoSeccion).toBe("minima_norma");
    expect(r.caidaTensionV).toBeCloseTo(2.1, 6);
    expect(r.caidaTensionPct).toBeCloseTo(0.955, 3);
  });

  it("4. Iluminación: 10 luminarias LED de 12 W a 20 m (IUG)", () => {
    // P = 10 · 12 = 120 W; Ib = 120 / 220 = 0,5455 A → In = 6 A; Iz(1,5) = 14 ≥ 6; mínima IUG 1,5 mm².
    // ΔU = 2 · 20 · 0,5455 · 0,0175 / 1,5 = 0,2545 V → 0,116 % ≤ 3 %. Curva B.
    const r = calcularCircuito(entrada([art({ nombre: "LED 12 W", potenciaW: 12, cantidad: 10, categoria: "iluminacion" })], { largoM: 20 }));
    expect(r.tipoCircuitoSugerido).toBe("IUG");
    expect(r.corrienteProyectoA).toBeCloseTo(0.545, 3);
    expect(r.termicaA).toBe(6);
    expect(r.seccionMm2).toBe(1.5);
    expect(r.curva).toBe("B");
    expect(r.limiteCaidaPct).toBe(3);
    expect(r.caidaTensionV).toBeCloseTo(0.255, 3);
  });

  it("5. Aire acondicionado de 3000 frigorías (≈ 1200 W eléctricos, cos φ 0,9)", () => {
    // Valor orientativo: 3000 frigorías/h ≈ 3500 W frigoríficos ≈ 1200 W eléctricos.
    // Ib = 1200 / (220 · 0,9) = 6,061 A. Equipo con circuito propio → TUE (Guía p. 8, aire acondicionado → TUE).
    // In = 10 A; sección 2,5 mm² (mínima de TUE).
    const r = calcularCircuito(entrada([art({ nombre: "Aire 3000 fg", potenciaW: 1200, cosPhi: 0.9, requiereCircuitoPropio: true })], { largoM: 12 }));
    expect(r.corrienteProyectoA).toBeCloseTo(6.061, 3);
    expect(r.tipoCircuitoSugerido).toBe("TUE");
    expect(r.termicaA).toBe(10);
    expect(r.seccionMm2).toBe(2.5);
  });

  it("6. Termotanque eléctrico de 1500 W", () => {
    // Ib = 1500 / 220 = 6,818 A → TUE (circuito propio), In = 10 A, 2,5 mm².
    const r = calcularCircuito(entrada([art({ nombre: "Termotanque", potenciaW: 1500, requiereCircuitoPropio: true })], { largoM: 8 }));
    expect(r.corrienteProyectoA).toBeCloseTo(6.818, 3);
    expect(r.tipoCircuitoSugerido).toBe("TUE");
    expect(r.termicaA).toBe(10);
    expect(r.seccionMm2).toBe(2.5);
  });

  it("7. Bomba trifásica 380 V, 4000 W, cos φ 0,85, a 30 m", () => {
    // Ib = 4000 / (√3 · 380 · 0,85) = 4000 / 559,45 = 7,150 A. Trifásica → ACU (carga única).
    // In = 10 A; Iz(1,5) = 14 ≥ 10; sección mínima de ACU sin dato (PENDIENTE) → 1,5 mm².
    // ΔU = √3 · 30 · 7,150 · 0,0175 · 0,85 / 1,5 = 3,684 V → 0,97 % de 380 V ≤ 5 %.
    const r = calcularCircuito(entrada([art({ nombre: "Bomba", potenciaW: 4000, cosPhi: 0.85 })], { sistema: "trifasico", tensionV: 380, largoM: 30 }));
    expect(r.corrienteProyectoA).toBeCloseTo(7.15, 2);
    expect(r.tipoCircuitoSugerido).toBe("ACU");
    expect(r.termicaA).toBe(10);
    expect(r.seccionMm2).toBe(1.5);
    expect(r.caidaTensionV).toBeCloseTo(3.684, 3);
    expect(r.caidaTensionPct).toBeCloseTo(0.97, 2);
    expect(r.advertencias.some((a) => a.includes("PENDIENTE_VERIFICAR"))).toBe(true);
  });

  it("8. Termotanque de 3800 W: la corriente obliga a subir de sección", () => {
    // Ib = 3800 / 220 = 17,27 A → In = 20 A. Iz(2,5) = 18 < 20 ✗; Iz(4) = 25 ≥ 20 ✓ → 4 mm², motivo "corriente".
    const r = calcularCircuito(entrada([art({ nombre: "Termotanque 3800", potenciaW: 3800, requiereCircuitoPropio: true })]));
    expect(r.corrienteProyectoA).toBeCloseTo(17.273, 3);
    expect(r.termicaA).toBe(20);
    expect(r.seccionMm2).toBe(4);
    expect(r.motivoSeccion).toBe("corriente");
  });

  it("9. Un TUE de 8000 W supera el calibre máximo (32 A) y pide dividir el circuito", () => {
    // Ib = 36,36 A → In = 40 A > 32 A (máximo de TUE, Guía p. 23), forzando el tipo TUE. Sin forzarlo, la app sugiere ACU (> 20 A).
    const a = art({ nombre: "Carga grande", potenciaW: 8000, requiereCircuitoPropio: true });
    expect(calcularCircuito(entrada([a])).tipoCircuitoSugerido).toBe("ACU");
    expect(() => calcularCircuito(entrada([a], { tipoCircuito: "TUE" }))).toThrow(ErrorCalculo);
  });
});
