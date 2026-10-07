import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AlmacenUsoArchivo, costoUsd, topeMensualUsd } from "./uso";

describe("uso y costo", () => {
  it("calcula el costo con los precios por millón de tokens", () => {
    expect(costoUsd({ entrada: 1_000_000, lecturaCache: 0, escrituraCache: 0, salida: 0 })).toBeCloseTo(2);
    expect(costoUsd({ entrada: 0, lecturaCache: 1_000_000, escrituraCache: 0, salida: 100_000 })).toBeCloseTo(0.2 + 1);
  });
  it("acumula por mes en un archivo", () => {
    const a = new AlmacenUsoArchivo(join(mkdtempSync(join(tmpdir(), "uso-")), "uso.json"));
    expect(a.leer("2026-10")).toEqual({ mes: "2026-10", usd: 0, consultas: 0 });
    a.sumar("2026-10", 0.5);
    expect(a.sumar("2026-10", 0.25)).toEqual({ mes: "2026-10", usd: 0.75, consultas: 2 });
    expect(a.leer("2026-11").usd).toBe(0);
  });
  it("el tope por defecto es 10 y nunca pasa de 20", () => {
    expect(topeMensualUsd({})).toBe(10);
    expect(topeMensualUsd({ TOPE_USD_MES: "5" })).toBe(5);
    expect(topeMensualUsd({ TOPE_USD_MES: "500" })).toBe(20);
    expect(topeMensualUsd({ TOPE_USD_MES: "abc" })).toBe(10);
  });
});
