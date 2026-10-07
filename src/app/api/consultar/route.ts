import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ejecutarAgente, type EventoAgente } from "@/integraciones/consulta/servidor/agente";
import { AlmacenUsoArchivo, mesDe, topeMensualUsd } from "@/integraciones/consulta/servidor/uso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cuerpo = z.object({
  pregunta: z.string().min(1).max(2000),
  contexto: z.string().max(60_000).optional(),
  historial: z.array(z.object({ rol: z.enum(["user", "assistant"]), texto: z.string().max(8000) })).max(12).default([]),
});

const json = (estado: number, error: string) => Response.json({ error }, { status: estado });

export async function POST(req: Request): Promise<Response> {
  // La clave vive solo en el servidor (variable de entorno); nunca se manda al cliente.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(503, "El asistente no está configurado (falta ANTHROPIC_API_KEY en el servidor).");

  const parsed = cuerpo.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json(400, "Consulta inválida.");

  const almacen = new AlmacenUsoArchivo();
  const mes = mesDe();
  const tope = topeMensualUsd();
  if (almacen.leer(mes).usd >= tope) return json(429, `Se alcanzó el tope de gasto mensual (${tope} USD). Podés subirlo con TOPE_USD_MES (máximo 20).`);

  const cliente = new Anthropic({ apiKey });
  const maxTokens = Number(process.env.MAX_TOKENS_RESPUESTA) || 2000;
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enviar = (e: EventoAgente) => controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      try {
        await ejecutarAgente({
          cliente,
          historial: parsed.data.historial,
          pregunta: parsed.data.pregunta,
          contexto: parsed.data.contexto,
          maxTokens,
          onEvento: (e) => {
            if (e.tipo === "fin") almacen.sumar(mes, e.costoUsd);
            enviar(e);
          },
        });
      } catch (e) {
        const mensaje =
          e instanceof Anthropic.RateLimitError
            ? "Demasiadas consultas seguidas. Esperá un momento."
            : e instanceof Anthropic.AuthenticationError
              ? "La clave de la API del servidor no es válida."
              : "No se pudo consultar al asistente. Probá de nuevo.";
        enviar({ tipo: "error", mensaje });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store, no-transform" } });
}
