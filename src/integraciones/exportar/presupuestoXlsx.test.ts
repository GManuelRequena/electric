import { describe, expect, it } from "vitest";
import { recalcularProyecto } from "@/dominio/circuitos/calcular";
import { calcularComputo } from "@/dominio/computo/computo";
import { armarPresupuesto } from "@/dominio/computo/presupuesto";
import { proyectoNuevo } from "@/dominio/proyecto/tipos";
import { presupuestoAXlsx } from "./presupuestoXlsx";

describe("presupuestoAXlsx", () => {
  it("genera un libro con los materiales y los totales", async () => {
    const p = proyectoNuevo({ nombre: "Casa", superficieM2: 70, sistema: "monofasico" });
    p.ambientes = [{ id: "a", nombre: "Estar", tipo: "estar-comedor" }];
    p.elementos = [{ id: "t", tipo: "toma_general", ambienteId: "a" }];
    const r = recalcularProyecto(p);
    const pr = armarPresupuesto(calcularComputo(r), new Map([["JABALINA", { codigo: "JABALINA", precioUnitario: 5000, moneda: "ARS", fecha: "2026-10-01", proveedor: "M" }]]), { modo: "fijo", valor: 1000 }, r);
    const bytes = await presupuestoAXlsx(pr, { obra: "Casa", cliente: "Ana", fecha: "2026-10-07" });
    const { default: ExcelJS } = await import("exceljs");
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(bytes);
    expect(libro.worksheets.map((h) => h.name)).toEqual(["Materiales", "Totales"]);
    expect(libro.getWorksheet("Materiales")!.rowCount).toBe(4 + pr.lineas.length);
    expect(libro.getWorksheet("Totales")!.getRow(3).getCell(2).value).toBe(6000);
  });
});
