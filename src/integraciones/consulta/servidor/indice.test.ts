import { describe, expect, it } from "vitest";
import { buscar, construirIndice, fragmentosDeTablas, partirPorArticulo, tokenizar } from "./indice";

const base = { norma: "AEA 90364-7-770", edicion: "2017", documento: "MODULO_6.pdf" };

describe("índice de la norma", () => {
  it("tokeniza sin tildes ni mayúsculas", () => {
    expect(tokenizar("Sección Mínima: Cañería")).toEqual(["seccion", "minima", "caneria"]);
  });

  it("parte por artículo, conserva la página y cita el artículo", () => {
    const texto = "Introducción general\n770.7.1 Grados de electrificación\nEl grado se define por la superficie.\n\f770.7.2 Circuitos\nSe exigen circuitos mínimos.";
    const fr = partirPorArticulo(texto, base);
    expect(fr.map((f) => f.fuente.referencia)).toEqual(["Introducción", "Art. 770.7.1", "Art. 770.7.2"]);
    expect(fr[1].fuente.pagina).toBe(1);
    expect(fr[2].fuente.pagina).toBe(2);
    expect(fr[2].texto).toContain("circuitos mínimos");
    expect(fr.every((f) => f.fuente.documento === "MODULO_6.pdf")).toBe(true);
  });

  it("corta los artículos largos en pedazos", () => {
    const fr = partirPorArticulo(`770.1.1 Largo\n${"x ".repeat(2000)}`, base, 1000);
    expect(fr.length).toBeGreaterThan(2);
  });

  it("BM25 devuelve primero el fragmento más relevante", () => {
    const idx = construirIndice([
      { id: "a", texto: "Caída de tensión máxima en circuitos de iluminación", fuente: { ...base, referencia: "Art. A" } },
      { id: "b", texto: "Puesta a tierra de las masas", fuente: { ...base, referencia: "Art. B" } },
    ]);
    const r = buscar(idx, "caida de tension iluminacion", 2);
    expect(r[0].fragmento.id).toBe("a");
    expect(r.every((x) => x.fragmento.id !== "b")).toBe(true);
    expect(buscar(idx, "zzz inexistente")).toEqual([]);
  });

  it("las tablas del repo se pueden buscar aunque no haya PDFs", () => {
    const fr = fragmentosDeTablas();
    expect(fr.length).toBeGreaterThan(10);
    const r = buscar(construirIndice(fr), "caida de tension", 3);
    expect(r[0].fragmento.texto.toLowerCase()).toContain("caída");
    expect(r[0].fragmento.fuente.referencia).toBeTruthy();
  });
});
