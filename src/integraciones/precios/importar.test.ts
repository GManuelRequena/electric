import { describe, expect, it } from "vitest";
import { importarPreciosCsv, parsearCsv, parsearNumero, plantillaPreciosCsv } from "./importar";

const HOY = "2026-10-07";

describe("importar precios", () => {
  it("lee un CSV válido", () => {
    const r = importarPreciosCsv("codigo,precio,moneda,fecha,proveedor\nCAJA_OCTOGONAL,350,ARS,2026-10-01,Casa Pérez\nJABALINA,\"18.000,50\",usd,01/10/2026,\n", HOY);
    expect(r.errores).toEqual([]);
    expect(r.precios).toEqual([
      { codigo: "CAJA_OCTOGONAL", precioUnitario: 350, moneda: "ARS", fecha: "2026-10-01", proveedor: "Casa Pérez" },
      { codigo: "JABALINA", precioUnitario: 18000.5, moneda: "USD", fecha: "2026-10-01", proveedor: "Manual" },
    ]);
  });

  it("rechaza las filas inválidas y reporta cuáles, e importa el resto", () => {
    const r = importarPreciosCsv(
      ["codigo,precio,moneda,fecha,proveedor", "CAJA_OCTOGONAL,100,ARS,,", "NO_EXISTE,5,ARS,,", "TAPA,abc,ARS,,", "BASTIDOR,-3,ARS,,", "CAJA_PASO,10,EUR,,", "MOD_TECLA,10,ARS,31/02/2026,", ",10,ARS,,", "CAJA_OCTOGONAL,120,ARS,,"].join("\n"),
      HOY,
    );
    expect(r.precios.map((p) => p.codigo)).toEqual(["CAJA_OCTOGONAL"]);
    expect(r.precios[0].fecha).toBe(HOY);
    expect(r.errores.map((e) => e.fila)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(r.errores[0].motivo).toMatch(/catálogo/);
  });

  it("pide las columnas obligatorias", () => {
    expect(importarPreciosCsv("nombre,valor\na,1\n", HOY).errores[0].motivo).toMatch(/codigo/);
    expect(importarPreciosCsv("", HOY).errores).toHaveLength(1);
  });

  it("acepta separador punto y coma y números argentinos", () => {
    expect(parsearCsv("a;b\n1;2\n")).toEqual([["a", "b"], ["1", "2"]]);
    expect(parsearNumero("1.234,50")).toBe(1234.5);
    expect(parsearNumero("$ 1.234")).toBe(1234);
    expect(parsearNumero("1234.5")).toBe(1234.5);
    expect(parsearNumero("12a")).toBeUndefined();
  });

  it("la plantilla se importa sin errores", () => {
    const r = importarPreciosCsv(plantillaPreciosCsv(), HOY);
    expect(r.errores).toEqual([]);
    expect(r.precios).toHaveLength(3);
  });
});
