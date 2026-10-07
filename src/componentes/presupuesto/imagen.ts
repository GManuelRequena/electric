"use client";

/** Lee una imagen y la reduce a `maxPx` de lado mayor; devuelve un data URL PNG (para el logo y la firma). */
export async function imagenADataUrl(archivo: File, maxPx = 400): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/png");
}
