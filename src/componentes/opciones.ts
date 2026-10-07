import { metodosDisponibles } from "@/dominio/calculo";

const ETIQUETAS: Record<string, string> = {
  "canerias-embutidas-o-a-la-vista-40C-3-cables": "Cañería embutida o a la vista (cable IRAM NM 247-3, 40 °C)",
};

export function etiquetaMetodo(clave: string): string {
  return ETIQUETAS[clave] ?? clave;
}

export function opcionesMetodo() {
  return metodosDisponibles().map((m) => ({ valor: m, texto: etiquetaMetodo(m) }));
}

export const METODO_POR_DEFECTO = "canerias-embutidas-o-a-la-vista-40C-3-cables";
