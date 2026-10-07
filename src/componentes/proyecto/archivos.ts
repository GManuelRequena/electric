"use client";

/** Baja un texto como archivo desde el navegador. */
export function descargarTexto(nombre: string, texto: string, tipo = "application/json"): void {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nombreArchivo(nombre: string): string {
  return nombre.normalize("NFD").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "proyecto";
}

/** Baja bytes (por ejemplo un .xlsx) como archivo desde el navegador. */
export function descargarBytes(nombre: string, bytes: ArrayBuffer, tipo: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
