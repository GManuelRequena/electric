import { NOMBRES_ELEMENTO, type Elemento, type Proyecto } from "@/dominio/proyecto/tipos";

export const ICONOS: Record<Elemento["tipo"], string> = {
  boca_luz: "💡",
  tecla_simple: "🔘",
  tecla_doble: "🔘",
  tecla_combinacion: "🔀",
  toma_general: "🔌",
  toma_especial: "⚡",
  toma_exterior: "🌧️",
  artefacto: "🔧",
};

export function etiquetaElemento(e: Elemento): string {
  return e.tipo === "artefacto" && e.artefacto ? e.artefacto.nombre : NOMBRES_ELEMENTO[e.tipo];
}

export function nombreAmbiente(p: Proyecto, id: string): string {
  return p.ambientes.find((a) => a.id === id)?.nombre ?? "";
}
