import { describe, expect, it } from "vitest";
import { calcularCircuito, calcularVivienda, metodosDisponibles } from "@/dominio/calculo";
import { definicionesParaApi, ejecutarHerramienta } from "./herramientas";

const artefacto = { id: "a", nombre: "carga", potenciaW: 3500, cantidad: 1, simultaneo: true };

describe("herramientas del asistente", () => {
  it("expone las cinco herramientas con esquema JSON", () => {
    const defs = definicionesParaApi();
    expect(defs.map((d) => d.name)).toEqual(["calcular_circuito", "calcular_vivienda", "validar_proyecto", "buscar_norma", "consultar_tabla"]);
    for (const d of defs) {
      expect(d.input_schema.type).toBe("object");
      expect(JSON.stringify(d.input_schema)).not.toContain("$schema");
    }
  });

  it("calcular_circuito devuelve lo mismo que la función del dominio", () => {
    const r = ejecutarHerramienta("calcular_circuito", { artefactos: [artefacto], largoM: 12 });
    expect(r.esError).toBe(false);
    const esperado = calcularCircuito({ sistema: "monofasico", tensionV: 220, artefactos: [artefacto], largoM: 12, metodoInstalacion: metodosDisponibles()[0], material: "cobre" });
    const out = JSON.parse(r.texto) as typeof esperado;
    expect(out.termicaA).toBe(esperado.termicaA);
    expect(out.seccionMm2).toBe(esperado.seccionMm2);
    expect(r.fuentes.length).toBeGreaterThan(0);
  });

  it("calcular_vivienda devuelve lo mismo que la función del dominio", () => {
    const r = ejecutarHerramienta("calcular_vivienda", { superficieM2: 90 });
    expect(JSON.parse(r.texto).grado).toBe(calcularVivienda({ superficieM2: 90, ambientes: [] }).grado);
  });

  it("valida la entrada y devuelve el error en vez de lanzar", () => {
    const r = ejecutarHerramienta("calcular_circuito", { artefactos: [] });
    expect(r.esError).toBe(true);
    expect(r.texto).toContain("Entrada inválida");
    expect(ejecutarHerramienta("calcular_vivienda", { superficieM2: -5 }).esError).toBe(true);
    expect(ejecutarHerramienta("no_existe", {}).esError).toBe(true);
  });

  it("un error de cálculo vuelve como is_error con el motivo", () => {
    const r = ejecutarHerramienta("calcular_circuito", { artefactos: [artefacto], metodoInstalacion: "metodo-que-no-existe" });
    expect(r.esError).toBe(true);
    expect(r.texto.length).toBeGreaterThan(5);
  });

  it("consultar_tabla filtra, cita y avisa si no existe", () => {
    const tabla = ejecutarHerramienta("consultar_tabla", { id: "aea770.tiposCircuito" });
    expect(tabla.esError).toBe(false);
    const t = JSON.parse(tabla.texto);
    expect(t.fuente.norma).toContain("AEA");
    expect(typeof t.verificado).toBe("boolean");
    const filtrada = JSON.parse(ejecutarHerramienta("consultar_tabla", { id: "aea770.tiposCircuito", filtro: { tipo: "TUG" } }).texto);
    expect(filtrada.filas.length).toBe(1);
    const mala = ejecutarHerramienta("consultar_tabla", { id: "otra" });
    expect(mala.esError).toBe(true);
    expect(mala.texto).toContain("aea770.tiposCircuito");
  });

  it("buscar_norma devuelve fragmentos con su cita", () => {
    const r = ejecutarHerramienta("buscar_norma", { consulta: "caída de tensión" });
    expect(r.esError).toBe(false);
    expect(r.fuentes.length).toBeGreaterThan(0);
    expect(r.fuentes[0].fuente.referencia).toBeTruthy();
  });

  it("validar_proyecto acepta el formato de backup y devuelve hallazgos", () => {
    const proyecto = {
      id: "p1", nombre: "Casa", tipoInmueble: "vivienda", norma: "aea770", superficieM2: 60, sistema: "monofasico",
      ambientes: [{ id: "c1", nombre: "Cocina", tipo: "cocina" }], elementos: [], circuitos: [],
      tablero: { principal: {}, puestaATierra: true }, config: { metrosPorBoca: 4, metrosHastaTablero: 5 },
    };
    const r = ejecutarHerramienta("validar_proyecto", proyecto);
    expect(r.esError).toBe(false);
    const hallazgos = JSON.parse(r.texto) as { severidad: string; mensaje: string }[];
    expect(hallazgos.some((h) => h.severidad === "info" && h.mensaje.includes("Grado de electrificación"))).toBe(true);
  });
});
