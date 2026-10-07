import { fmt } from "../calculo";
import { contarBocas } from "../circuitos/largo";
import type { Proyecto } from "./tipos";

export interface NodoUnifilar {
  clave: string;
  tipo: "acometida" | "tablero" | "circuito";
  etiqueta: string;
  detalle: string[];
  /** ✓ cumple, ⚠ revisar, vacío si no aplica. */
  estado?: "ok" | "revisar";
  hijos: NodoUnifilar[];
}

/** Estructura pura del unifilar: acometida → tablero principal → un nodo por circuito. El SVG lo dibuja la UI. */
export function modeloUnifilar(p: Proyecto): NodoUnifilar {
  const tab = p.tablero;
  const circuitos: NodoUnifilar[] = p.circuitos.map((c) => {
    const r = c.resultado;
    const detalle = [`${contarBocas(p, c.id)} bocas`];
    if (r) {
      detalle.push(`${fmt(r.seccionMm2)} mm²`, `${r.termicaA} A curva ${r.curva}`);
      if (r.diferencial.obligatorio) detalle.push(`ID ${r.diferencial.sensibilidadMa} mA`);
    } else detalle.push(c.error ?? "sin calcular");
    return { clave: c.id, tipo: "circuito", etiqueta: c.id, detalle, estado: r ? (r.cumple ? "ok" : "revisar") : "revisar", hijos: [] };
  });
  const tablero: NodoUnifilar = {
    clave: "tablero",
    tipo: "tablero",
    etiqueta: "Tablero principal",
    detalle: [
      tab.principal.termicaA != null ? `Térmica general ${tab.principal.termicaA} A` : "Térmica general sin definir",
      tab.principal.diferencialMa != null ? `Diferencial ${tab.principal.diferencialMa} mA` : "Sin diferencial",
      tab.puestaATierra ? "Puesta a tierra (PE)" : "Sin puesta a tierra",
    ],
    hijos: circuitos,
  };
  return { clave: "acometida", tipo: "acometida", etiqueta: p.sistema === "trifasico" ? "Acometida trifásica" : "Acometida monofásica", detalle: [], hijos: [tablero] };
}
