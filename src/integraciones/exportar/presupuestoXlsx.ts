import { NOMBRES_CATEGORIA } from "@/dominio/computo/tipos";
import type { Presupuesto } from "@/dominio/computo/presupuesto";

export interface EncabezadoXlsx {
  obra: string;
  cliente: string;
  fecha: string;
}

/** Planilla con el presupuesto: una hoja de materiales y otra de totales. Devuelve los bytes del .xlsx. */
export async function presupuestoAXlsx(pr: Presupuesto, enc: EncabezadoXlsx): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  libro.creator = "Electricista";

  const hoja = libro.addWorksheet("Materiales");
  hoja.addRow([`Obra: ${enc.obra}`]);
  hoja.addRow([`Cliente: ${enc.cliente}`, `Fecha: ${enc.fecha}`]);
  hoja.addRow([]);
  const cab = hoja.addRow(["Categoría", "Código", "Descripción", "Cantidad", "Unidad", "Estimado", "Precio unitario (ARS)", "Subtotal (ARS)", "Origen"]);
  cab.font = { bold: true };
  const ordenadas = [...pr.lineas].sort((a, b) => (a.item?.categoria ?? "").localeCompare(b.item?.categoria ?? "") || a.codigo.localeCompare(b.codigo));
  for (const l of ordenadas) {
    hoja.addRow([
      l.item ? NOMBRES_CATEGORIA[l.item.categoria] : "",
      l.codigo,
      l.item?.descripcion ?? l.codigo,
      l.cantidad,
      l.item?.unidad ?? "u",
      l.estimado ? "sí" : "",
      l.precioUnitarioArs ?? "",
      l.subtotal ?? "",
      l.origen.join(", "),
    ]);
  }
  hoja.columns = [{ width: 18 }, { width: 30 }, { width: 55 }, { width: 10 }, { width: 8 }, { width: 10 }, { width: 20 }, { width: 18 }, { width: 24 }];

  const tot = libro.addWorksheet("Totales");
  tot.addRows([
    ["Materiales", pr.materiales],
    ["Mano de obra", pr.manoDeObra],
    ["Total", pr.total],
    [],
    ["Ítems sin precio (no suman al total)", pr.sinPrecio.length],
    ...pr.sinPrecio.map((c) => [c]),
  ]);
  tot.getRow(3).font = { bold: true };
  tot.columns = [{ width: 40 }, { width: 18 }];
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer;
}
