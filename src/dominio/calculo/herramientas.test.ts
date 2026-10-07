import { describe, expect, it } from "vitest";
import { consumoEnergetico, correccionFactorPotencia, dimensionadoFotovoltaico, ErrorCalculo, leyDeOhm, potenciaCa } from "./index";

describe("leyDeOhm", () => {
  it("V e I → R y P", () => {
    const r = leyDeOhm({ tensionV: 12, corrienteA: 2 });
    expect(r.resistenciaOhm).toBeCloseTo(6);
    expect(r.potenciaW).toBeCloseTo(24);
  });
  it("cualquier par da resultados consistentes", () => {
    const base = leyDeOhm({ tensionV: 24, resistenciaOhm: 8 });
    expect(base.corrienteA).toBeCloseTo(3);
    for (const par of [{ tensionV: 24, potenciaW: base.potenciaW }, { corrienteA: 3, resistenciaOhm: 8 }, { corrienteA: 3, potenciaW: base.potenciaW }, { resistenciaOhm: 8, potenciaW: base.potenciaW }]) {
      const r = leyDeOhm(par);
      expect(r.tensionV).toBeCloseTo(24);
      expect(r.corrienteA).toBeCloseTo(3);
      expect(r.resistenciaOhm).toBeCloseTo(8);
    }
  });
  it("exige exactamente dos datos y valores positivos", () => {
    expect(() => leyDeOhm({ tensionV: 12 })).toThrow(ErrorCalculo);
    expect(() => leyDeOhm({ tensionV: 12, corrienteA: 1, potenciaW: 12 })).toThrow(ErrorCalculo);
    expect(() => leyDeOhm({ tensionV: -1, corrienteA: 1 })).toThrow(ErrorCalculo);
  });
});

describe("potenciaCa", () => {
  it("monofásica desde corriente", () => {
    const r = potenciaCa({ sistema: "monofasico", tensionV: 220, cosPhi: 0.8, corrienteA: 10 });
    expect(r.potenciaAparenteVA).toBeCloseTo(2200);
    expect(r.potenciaActivaW).toBeCloseTo(1760);
    expect(r.potenciaReactivaVAr).toBeCloseTo(1320);
  });
  it("trifásica desde potencia es inversa de desde corriente", () => {
    const a = potenciaCa({ sistema: "trifasico", tensionV: 380, cosPhi: 0.9, potenciaW: 10000 });
    const b = potenciaCa({ sistema: "trifasico", tensionV: 380, cosPhi: 0.9, corrienteA: a.corrienteA });
    expect(a.corrienteA).toBeCloseTo(16.88, 1);
    expect(b.potenciaActivaW).toBeCloseTo(10000);
  });
  it("valida cos φ y exclusividad de datos", () => {
    expect(() => potenciaCa({ sistema: "monofasico", tensionV: 220, cosPhi: 1.2, corrienteA: 1 })).toThrow(ErrorCalculo);
    expect(() => potenciaCa({ sistema: "monofasico", tensionV: 220, cosPhi: 1, corrienteA: 1, potenciaW: 1 })).toThrow(ErrorCalculo);
  });
});

describe("consumoEnergetico", () => {
  it("kWh y costo", () => {
    const r = consumoEnergetico({ potenciaW: 2000, horasPorDia: 3, diasPorMes: 30, tarifaPorKwh: 100 });
    expect(r.kwhDia).toBeCloseTo(6);
    expect(r.kwhMes).toBeCloseTo(180);
    expect(r.costoMes).toBeCloseTo(18000);
  });
  it("rechaza horas fuera de rango", () => {
    expect(() => consumoEnergetico({ potenciaW: 100, horasPorDia: 25, diasPorMes: 30, tarifaPorKwh: 1 })).toThrow(ErrorCalculo);
  });
});

describe("correccionFactorPotencia", () => {
  it("10 kW de 0,8 a 0,95 ≈ 4,21 kVAr", () => {
    const r = correccionFactorPotencia({ potenciaW: 10000, cosActual: 0.8, cosObjetivo: 0.95 });
    expect(r.kvar).toBeCloseTo(4.21, 1);
  });
  it("el objetivo debe superar al actual", () => {
    expect(() => correccionFactorPotencia({ potenciaW: 1000, cosActual: 0.9, cosObjetivo: 0.8 })).toThrow(ErrorCalculo);
  });
});

describe("dimensionadoFotovoltaico", () => {
  it("paneles y banco", () => {
    const r = dimensionadoFotovoltaico({ consumoDiarioWh: 2000, horasSolPico: 4.5, potenciaPanelWp: 330, rendimiento: 0.75, diasAutonomia: 2, tensionBancoV: 24, profundidadDescarga: 0.5 });
    expect(r.panelesNecesarios).toBe(2); // 2000/(4,5·0,75)=592,6 Wp → 1,8 → 2
    expect(r.capacidadBancoWh).toBeCloseTo(8000);
    expect(r.capacidadBancoAh).toBeCloseTo(333.33, 1);
  });
  it("rechaza rendimiento inválido", () => {
    expect(() => dimensionadoFotovoltaico({ consumoDiarioWh: 1, horasSolPico: 1, potenciaPanelWp: 1, rendimiento: 0, diasAutonomia: 1, tensionBancoV: 12, profundidadDescarga: 0.5 })).toThrow(ErrorCalculo);
  });
});
