import { itemDeCodigo } from "@/dominio/computo/materiales";
import type { Precio } from "./PriceProvider";

export interface ErrorImportacion {
  /** Número de fila tal como se ve en la planilla (la 1 es el encabezado). */
  fila: number;
  motivo: string;
}

export interface ResultadoImportacion {
  precios: Precio[];
  errores: ErrorImportacion[];
}

export const COLUMNAS_PRECIOS = ["codigo", "precio", "moneda", "fecha", "proveedor"] as const;

/** CSV con comillas, separador `,` o `;` (el que más aparezca en el encabezado) y BOM opcional. */
export function parsearCsv(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "");
  const primera = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let entreComillas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (entreComillas) {
      if (ch === '"' && t[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (ch === '"') entreComillas = false;
      else celda += ch;
    } else if (ch === '"') entreComillas = true;
    else if (ch === sep) {
      fila.push(celda);
      celda = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else celda += ch;
  }
  if (celda !== "" || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

/** "1.234,50", "1234,5", "1234.5" y "$ 1.234,50" → número; undefined si no es un número. */
export function parsearNumero(s: string): number | undefined {
  const limpio = s.replace(/[$\s]/g, "");
  if (!/^\d[\d.,]*$/.test(limpio)) return undefined;
  const coma = limpio.lastIndexOf(",");
  const punto = limpio.lastIndexOf(".");
  let normal: string;
  if (coma >= 0 && punto >= 0) normal = coma > punto ? limpio.replace(/\./g, "").replace(",", ".") : limpio.replace(/,/g, "");
  else if (coma >= 0) normal = limpio.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) normal = limpio.replace(/\./g, "");
  else normal = limpio;
  const n = Number(normal);
  return Number.isFinite(n) ? n : undefined;
}

function parsearFecha(s: string): string | undefined {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const ar = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  const [a, m, d] = iso ? [iso[1], iso[2], iso[3]] : ar ? [ar[3], ar[2].padStart(2, "0"), ar[1].padStart(2, "0")] : [];
  if (!a) return undefined;
  const f = new Date(`${a}-${m}-${d}T00:00:00Z`);
  return !Number.isNaN(f.getTime()) && f.toISOString().slice(0, 10) === `${a}-${m}-${d}` ? `${a}-${m}-${d}` : undefined;
}

/**
 * Valida las filas de una planilla (encabezado `codigo, precio, moneda, fecha, proveedor`).
 * Las filas inválidas se rechazan y se reportan con su número; las válidas se importan igual.
 */
export function precioDesdeFilas(filas: string[][], hoy = new Date().toISOString().slice(0, 10)): ResultadoImportacion {
  const precios: Precio[] = [];
  const errores: ErrorImportacion[] = [];
  if (filas.length === 0) return { precios, errores: [{ fila: 1, motivo: "La planilla está vacía." }] };

  const encabezado = filas[0].map((c) => c.trim().toLowerCase());
  const col = Object.fromEntries(COLUMNAS_PRECIOS.map((c) => [c, encabezado.indexOf(c)])) as Record<(typeof COLUMNAS_PRECIOS)[number], number>;
  if (col.codigo < 0 || col.precio < 0) {
    return { precios, errores: [{ fila: 1, motivo: "Faltan las columnas obligatorias `codigo` y `precio` en el encabezado." }] };
  }
  const celda = (f: string[], c: keyof typeof col) => (col[c] >= 0 ? (f[col[c]] ?? "").trim() : "");

  const vistos = new Set<string>();
  filas.slice(1).forEach((f, i) => {
    const fila = i + 2;
    const codigo = celda(f, "codigo");
    if (!codigo) return errores.push({ fila, motivo: "Falta el código." });
    if (!itemDeCodigo(codigo)) return errores.push({ fila, motivo: `El código "${codigo}" no está en el catálogo.` });
    if (vistos.has(codigo)) return errores.push({ fila, motivo: `El código "${codigo}" está repetido.` });
    const precioUnitario = parsearNumero(celda(f, "precio"));
    if (precioUnitario == null || precioUnitario <= 0) return errores.push({ fila, motivo: `El precio "${celda(f, "precio")}" no es un número mayor que 0.` });
    const monedaCruda = celda(f, "moneda").toUpperCase() || "ARS";
    if (monedaCruda !== "ARS" && monedaCruda !== "USD") return errores.push({ fila, motivo: `La moneda "${monedaCruda}" no es ARS ni USD.` });
    const fechaCruda = celda(f, "fecha");
    const fecha = fechaCruda ? parsearFecha(fechaCruda) : hoy;
    if (!fecha) return errores.push({ fila, motivo: `La fecha "${fechaCruda}" no es válida (usá AAAA-MM-DD o DD/MM/AAAA).` });
    vistos.add(codigo);
    precios.push({ codigo, precioUnitario, moneda: monedaCruda, fecha, proveedor: celda(f, "proveedor") || "Manual" });
  });
  return { precios, errores };
}

export const importarPreciosCsv = (texto: string, hoy?: string) => precioDesdeFilas(parsearCsv(texto), hoy);

export async function importarPreciosXlsx(datos: ArrayBuffer, hoy?: string): Promise<ResultadoImportacion> {
  const { default: ExcelJS } = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(datos);
  const hoja = libro.worksheets[0];
  const filas: string[][] = [];
  hoja?.eachRow({ includeEmpty: false }, (row) => {
    const celdas: string[] = [];
    for (let c = 1; c <= row.cellCount; c++) {
      const v = row.getCell(c).value;
      celdas.push(v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : typeof v === "object" && "text" in v ? String(v.text) : String(v));
    }
    filas.push(celdas);
  });
  return precioDesdeFilas(filas, hoy);
}

/** Plantilla descargable con ejemplos reales del catálogo. */
export function plantillaPreciosCsv(): string {
  return ["codigo,precio,moneda,fecha,proveedor", "CAJA_OCTOGONAL,350,ARS,2026-10-01,Mi proveedor", "CABLE_UNI_2.5_CU_CELESTE,1200,ARS,2026-10-01,Mi proveedor", "JABALINA,18000,ARS,2026-10-01,Mi proveedor"].join("\n") + "\n";
}
