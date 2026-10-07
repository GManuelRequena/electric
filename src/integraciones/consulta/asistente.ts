import type { CitaFuente } from "./servidor/herramientas";

/** Consulta externa (link a NotebookLM): copia la pregunta y abre el notebook. */
export interface ConsultaExterna {
  consultar(pregunta: string, contexto?: string): Promise<{ copiado: boolean }>;
}

export function armarConsulta(pregunta: string, contexto?: string): string {
  const partes = [];
  if (contexto) partes.push(`Contexto del cálculo:\n${contexto}`);
  partes.push(`Pregunta: ${pregunta}`);
  partes.push("Respondé según la AEA 90364 (sección 770) y citá la tabla o el artículo.");
  return partes.join("\n\n");
}

export class NotebookLmLink implements ConsultaExterna {
  constructor(private readonly url: string) {}

  async consultar(pregunta: string, contexto?: string): Promise<{ copiado: boolean }> {
    let copiado = false;
    try {
      await navigator.clipboard.writeText(armarConsulta(pregunta, contexto));
      copiado = true;
    } catch {
      /* sin permiso de portapapeles: se abre igual el notebook */
    }
    if (this.url) window.open(this.url, "_blank", "noopener,noreferrer");
    return { copiado };
  }
}

export type { CitaFuente };

/** Respuesta completa del asistente con IA (Fase 4). */
export interface RespuestaAsistente {
  texto: string;
  citas: CitaFuente[];
  herramientasUsadas: string[];
  costoUsd?: number;
}

export interface Turno {
  rol: "user" | "assistant";
  texto: string;
}

export interface OpcionesPregunta {
  contexto?: string;
  historial?: Turno[];
  /** Se llama con cada fragmento de texto a medida que llega (streaming). */
  onTexto?: (fragmento: string) => void;
  onHerramienta?: (nombre: string) => void;
  signal?: AbortSignal;
}

/** Asistente que responde preguntas sobre la norma. `ClaudeAsistente` es la implementación con IA. */
export interface AsistenteNorma {
  id: string;
  preguntar(pregunta: string, opciones?: OpcionesPregunta): Promise<RespuestaAsistente>;
}
