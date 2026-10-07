import { describe, expect, it } from "vitest";
import { codificarEstado, decodificarEstado, leerEstadoDeUrl, urlCompartible } from "./estado";

const base = { a: "", b: "x" };

describe("estado en la URL", () => {
  it("ida y vuelta con acentos y símbolos", () => {
    const e = { a: "cos φ 0,8", b: "Ω/ñ" };
    expect(decodificarEstado(codificarEstado(e), base)).toEqual(e);
  });
  it("sin código o con basura devuelve la base", () => {
    expect(decodificarEstado(null, base)).toEqual(base);
    expect(decodificarEstado("%%%", base)).toEqual(base);
    expect(decodificarEstado(codificarEstado({ a: "1" }), base)).toEqual({ a: "1", b: "x" });
  });
  it("ignora claves ajenas, no-strings y valores largos", () => {
    const c = btoa(JSON.stringify({ a: 5, b: "y".repeat(100), z: "q" }));
    expect(decodificarEstado(c, base)).toEqual(base);
  });
  it("arma y lee la URL", () => {
    const u = urlCompartible("https://x.app", "/calcular/herramientas/ohm", { a: "12", b: "2" });
    expect(leerEstadoDeUrl(new URL(u).search, base)).toEqual({ a: "12", b: "2" });
  });
});
