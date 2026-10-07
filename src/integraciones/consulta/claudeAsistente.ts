import type { AsistenteNorma, CitaFuente, OpcionesPregunta, RespuestaAsistente } from "./asistente";
import type { EventoAgente } from "./servidor/agente";

/** Parte un buffer SSE en eventos completos; devuelve lo que sobra para el próximo pedazo. */
export function parsearSSE(buffer: string): { eventos: EventoAgente[]; resto: string } {
  const bloques = buffer.split("\n\n");
  const resto = bloques.pop() ?? "";
  const eventos: EventoAgente[] = [];
  for (const b of bloques) {
    const datos = b
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim())
      .join("");
    if (!datos) continue;
    try {
      eventos.push(JSON.parse(datos) as EventoAgente);
    } catch {
      /* evento dañado: se ignora */
    }
  }
  return { eventos, resto };
}

export class ErrorAsistente extends Error {
  constructor(
    mensaje: string,
    readonly estado?: number,
  ) {
    super(mensaje);
    this.name = "ErrorAsistente";
  }
}

/** Cliente del endpoint /api/consultar (SSE). No conoce la clave de la API: vive en el servidor. */
export class ClaudeAsistente implements AsistenteNorma {
  readonly id = "claude";
  constructor(private readonly url = "/api/consultar") {}

  async preguntar(pregunta: string, o: OpcionesPregunta = {}): Promise<RespuestaAsistente> {
    const resp = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta, contexto: o.contexto, historial: o.historial ?? [] }),
      signal: o.signal,
    });
    if (!resp.ok || !resp.body) {
      const err = (await resp.json().catch(() => null)) as { error?: string } | null;
      throw new ErrorAsistente(err?.error ?? "No se pudo consultar al asistente.", resp.status);
    }
    const lector = resp.body.getReader();
    const dec = new TextDecoder();
    let buffer = "";
    let texto = "";
    let citas: CitaFuente[] = [];
    let usadas: string[] = [];
    let costoUsd: number | undefined;
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const { eventos, resto } = parsearSSE(buffer);
      buffer = resto;
      for (const e of eventos) {
        if (e.tipo === "texto") {
          texto += e.texto;
          o.onTexto?.(e.texto);
        } else if (e.tipo === "herramienta") o.onHerramienta?.(e.nombre);
        else if (e.tipo === "citas") citas = e.citas;
        else if (e.tipo === "fin") {
          usadas = e.herramientasUsadas;
          costoUsd = e.costoUsd;
        } else if (e.tipo === "error") throw new ErrorAsistente(e.mensaje);
      }
    }
    return { texto, citas, herramientasUsadas: usadas, costoUsd };
  }
}
