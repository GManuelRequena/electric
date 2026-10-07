import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { ManualPriceProvider } from "./ManualPriceProvider";
import { MockPriceProvider } from "./PriceProvider";

const p = (codigo: string, precioUnitario: number) => ({ codigo, precioUnitario, moneda: "ARS" as const, fecha: "2026-10-01", proveedor: "Manual" });

describe("ManualPriceProvider", () => {
  const prov = new ManualPriceProvider();
  beforeEach(() => prov.borrarTodos());

  it("guarda, consulta y borra precios", async () => {
    await prov.guardar([p("JABALINA", 100), p("TAPA", 5)]);
    expect((await prov.obtenerPrecios(["JABALINA", "BASTIDOR"])).get("JABALINA")?.precioUnitario).toBe(100);
    expect((await prov.obtenerPrecios(["BASTIDOR"])).size).toBe(0);
    await prov.guardar(p("JABALINA", 120)); // reemplaza
    expect((await prov.listar()).map((x) => x.precioUnitario)).toEqual([120, 5]);
    await prov.borrar("TAPA");
    expect(await prov.listar()).toHaveLength(1);
  });
});

describe("MockPriceProvider", () => {
  it("cumple la misma interfaz", async () => {
    const m = await new MockPriceProvider({ TAPA: 7 }).obtenerPrecios(["TAPA", "JABALINA"]);
    expect([...m.keys()]).toEqual(["TAPA"]);
  });
});
