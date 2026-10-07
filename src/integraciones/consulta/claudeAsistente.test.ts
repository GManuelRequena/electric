import { afterEach, describe, expect, it, vi } from "vitest";
import { ClaudeAsistente, ErrorAsistente, parsearSSE } from "./claudeAsistente";

const sse = (...evs: object[]) => evs.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");

describe("cliente SSE", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("separa eventos completos y guarda el resto", () => {
    const { eventos, resto } = parsearSSE('data: {"tipo":"texto","texto":"a"}\n\ndata: {"tipo":"tex');
    expect(eventos).toEqual([{ tipo: "texto", texto: "a" }]);
    expect(resto).toBe('data: {"tipo":"tex');
  });

  it("arma la respuesta aunque los eventos lleguen cortados", async () => {
    const completo = sse({ tipo: "herramienta", nombre: "calcular_circuito" }, { tipo: "texto", texto: "Hola " }, { tipo: "texto", texto: "mundo" }, { tipo: "citas", citas: [{ fuente: { norma: "AEA", edicion: "2017", referencia: "Tabla 1", documento: "x" } }] }, { tipo: "fin", herramientasUsadas: ["calcular_circuito"], uso: {}, costoUsd: 0.01 });
    const enc = new TextEncoder();
    const body = new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(completo.slice(0, 40)));
        c.enqueue(enc.encode(completo.slice(40)));
        c.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 200 })));
    const trozos: string[] = [];
    const r = await new ClaudeAsistente().preguntar("?", { onTexto: (t) => trozos.push(t) });
    expect(r.texto).toBe("Hola mundo");
    expect(trozos).toEqual(["Hola ", "mundo"]);
    expect(r.herramientasUsadas).toEqual(["calcular_circuito"]);
    expect(r.citas).toHaveLength(1);
    expect(r.costoUsd).toBe(0.01);
  });

  it("sin sesión lanza un error con el estado 401", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "Iniciá sesión" }, { status: 401 })));
    await expect(new ClaudeAsistente().preguntar("?")).rejects.toMatchObject({ estado: 401, message: "Iniciá sesión" });
  });

  it("un evento de error del servidor se convierte en excepción", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(sse({ tipo: "error", mensaje: "falló" }), { status: 200 })));
    await expect(new ClaudeAsistente().preguntar("?")).rejects.toBeInstanceOf(ErrorAsistente);
  });
});
