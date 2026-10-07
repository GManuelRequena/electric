import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { ejecutarAgente, type ClienteMensajes, type EventoAgente } from "./agente";

type Params = Anthropic.MessageStreamParams;

function mensaje(parcial: Partial<Anthropic.Message>): Anthropic.Message {
  return { id: "m", type: "message", role: "assistant", model: "x", stop_reason: "end_turn", stop_sequence: null, content: [], usage: { input_tokens: 1000, output_tokens: 100 }, ...parcial } as Anthropic.Message;
}

function clienteFalso(respuestas: { texto?: string; msg: Anthropic.Message }[], vistos: Params[] = []): ClienteMensajes {
  let i = 0;
  return {
    messages: {
      stream(params) {
        vistos.push(JSON.parse(JSON.stringify(params)));
        const r = respuestas[i++];
        const eventos = r.texto ? [{ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: r.texto } }] : [];
        return Object.assign(
          (async function* () {
            for (const e of eventos) yield e as unknown as Anthropic.MessageStreamEvent;
          })(),
          { finalMessage: async () => r.msg },
        );
      },
    },
  };
}

describe("agente con tool use", () => {
  it("ejecuta la herramienta pedida, devuelve el resultado al modelo y junta las citas", async () => {
    const vistos: Params[] = [];
    const cliente = clienteFalso(
      [
        { msg: mensaje({ stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "calcular_circuito", input: { artefactos: [{ nombre: "carga", potenciaW: 3500 }] } }] as Anthropic.ContentBlock[] }) },
        { texto: "Térmica de X A.", msg: mensaje({ content: [{ type: "text", text: "Térmica de X A." }] as Anthropic.ContentBlock[], usage: { input_tokens: 2000, output_tokens: 50, cache_read_input_tokens: 500 } as Anthropic.Usage }) },
      ],
      vistos,
    );
    const eventos: EventoAgente[] = [];
    await ejecutarAgente({ cliente, historial: [{ rol: "user", texto: "hola" }, { rol: "assistant", texto: "hola!" }], pregunta: "¿Qué térmica para 3500 W?", onEvento: (e) => eventos.push(e) });

    expect(eventos.map((e) => e.tipo)).toEqual(["herramienta", "texto", "citas", "fin"]);
    const fin = eventos.at(-1) as Extract<EventoAgente, { tipo: "fin" }>;
    expect(fin.herramientasUsadas).toEqual(["calcular_circuito"]);
    expect(fin.uso).toEqual({ entrada: 3000, salida: 150, lecturaCache: 500, escrituraCache: 0 });
    expect(fin.costoUsd).toBeGreaterThan(0);
    expect((eventos[2] as Extract<EventoAgente, { tipo: "citas" }>).citas.length).toBeGreaterThan(0);

    // Primera llamada: modelo Sonnet, prompt caching, 5 herramientas, historial + pregunta.
    expect(vistos[0].model).toBe("claude-sonnet-5-5");
    expect(vistos[0].tools).toHaveLength(5);
    expect(vistos[0].messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(JSON.stringify(vistos[0])).toContain("cache_control");
    // Segunda llamada: trae el tool_result con el cálculo del dominio.
    const ultimo = vistos[1].messages.at(-1)!;
    expect(JSON.stringify(ultimo.content)).toContain("tool_result");
    expect(JSON.stringify(ultimo.content)).toContain("termicaA");
  });

  it("si la herramienta falla, el modelo recibe is_error y puede corregir", async () => {
    const vistos: Params[] = [];
    const cliente = clienteFalso(
      [
        { msg: mensaje({ stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "calcular_circuito", input: { artefactos: [] } }] as Anthropic.ContentBlock[] }) },
        { texto: "Necesito la potencia.", msg: mensaje({}) },
      ],
      vistos,
    );
    await ejecutarAgente({ cliente, historial: [], pregunta: "?", onEvento: () => {} });
    expect(JSON.stringify(vistos[1].messages.at(-1)!.content)).toContain('"is_error":true');
  });

  it("una negativa del modelo se informa sin romper", async () => {
    const eventos: EventoAgente[] = [];
    await ejecutarAgente({ cliente: clienteFalso([{ msg: mensaje({ stop_reason: "refusal" }) }]), historial: [], pregunta: "?", onEvento: (e) => eventos.push(e) });
    expect(eventos[0].tipo).toBe("error");
    expect(eventos.at(-1)?.tipo).toBe("fin");
  });

  it("corta si el modelo pide herramientas sin parar", async () => {
    const pide = { msg: mensaje({ stop_reason: "tool_use", content: [{ type: "tool_use", id: "t", name: "buscar_norma", input: { consulta: "caida" } }] as Anthropic.ContentBlock[] }) };
    const eventos: EventoAgente[] = [];
    await ejecutarAgente({ cliente: clienteFalso(Array(3).fill(pide)), historial: [], pregunta: "?", maxIteraciones: 3, onEvento: (e) => eventos.push(e) });
    expect(eventos.some((e) => e.tipo === "error")).toBe(true);
  });
});
