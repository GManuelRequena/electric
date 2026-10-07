/** Interfaz para consultar la norma; hoy es un link a NotebookLM, en la Fase 4 será un chat con IA. */
export interface AsistenteNorma {
  consultar(pregunta: string, contexto?: string): Promise<{ copiado: boolean }>;
}

export function armarConsulta(pregunta: string, contexto?: string): string {
  const partes = [];
  if (contexto) partes.push(`Contexto del cálculo:\n${contexto}`);
  partes.push(`Pregunta: ${pregunta}`);
  partes.push("Respondé según la AEA 90364 (sección 770) y citá la tabla o el artículo.");
  return partes.join("\n\n");
}

export class NotebookLmLink implements AsistenteNorma {
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
