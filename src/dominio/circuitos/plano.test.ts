import { describe, expect, it } from "vitest";
import { proyectoNuevo, type Elemento, type Proyecto } from "../proyecto/tipos";
import { esquemaProyecto, exportarProyecto, importarProyecto } from "../proyecto/esquema";
import { asignarCircuitos } from "./asignar";
import { recalcularProyecto } from "./calcular";
import { largoDeCircuito } from "./largo";
import { estadoPlanoDeCircuito, largoDesdePlano } from "./plano";

const luz = (id: string): Elemento => ({ id, tipo: "boca_luz", ambienteId: "a" });
const toma = (id: string): Elemento => ({ id, tipo: "toma_general", ambienteId: "a" });

function proyecto(elementos: Elemento[]): Proyecto {
  const p = proyectoNuevo({ nombre: "Plano", superficieM2: 60, sistema: "monofasico" }, "2026-01-01T00:00:00.000Z");
  p.ambientes = [{ id: "a", nombre: "Estar", tipo: "estar-comedor" }];
  return asignarCircuitos({ ...p, elementos });
}

describe("largoDesdePlano", () => {
  it("suma Manhattan horizontal más subida y bajada por altura", () => {
    const p = proyecto([luz("l1"), luz("l2")]);
    p.plano = { ambientes: [], tablero: { x: 0, y: 0 }, posiciones: { l1: { x: 3, y: 0 }, l2: { x: 3, y: 4 } } };
    // tablero (1,5 m) → l1: 3 + 1,1 = 4,1 · l1 → l2: 4 + 0 = 4
    const r = largoDesdePlano("IUG1", p)!;
    expect(r.largoM).toBe(8.1);
    expect(r.recorrido).toEqual(["l1", "l2"]);
  });

  it("va a la boca más cercana primero, sin importar el orden de carga", () => {
    const p = proyecto([luz("lejos"), luz("cerca")]);
    p.plano = { ambientes: [], tablero: { x: 0, y: 0 }, posiciones: { lejos: { x: 10, y: 0 }, cerca: { x: 1, y: 0 } } };
    expect(largoDesdePlano("IUG1", p)!.recorrido).toEqual(["cerca", "lejos"]);
  });

  it("usa la altura de toma para los tomacorrientes y respeta alturas del proyecto", () => {
    const p = proyecto([toma("t1")]);
    p.config = { ...p.config, alturas: { tableroM: 1.5, techoM: 2.6, tomaM: 0.5 } };
    p.plano = { ambientes: [], tablero: { x: 0, y: 0 }, posiciones: { t1: { x: 2, y: 1 } } };
    expect(largoDesdePlano("TUG1", p)!.largoM).toBe(4); // 2 + 1 + |1,5 − 0,5|
  });

  it("devuelve null sin plano, sin tablero o con bocas sin ubicar", () => {
    const p = proyecto([luz("l1"), luz("l2")]);
    expect(largoDesdePlano("IUG1", p)).toBeNull();
    p.plano = { ambientes: [], posiciones: { l1: { x: 1, y: 1 }, l2: { x: 2, y: 2 } } };
    expect(largoDesdePlano("IUG1", p)).toBeNull();
    p.plano = { ambientes: [], tablero: { x: 0, y: 0 }, posiciones: { l1: { x: 1, y: 1 } } };
    expect(largoDesdePlano("IUG1", p)).toBeNull();
    expect(estadoPlanoDeCircuito(p, "IUG1")).toEqual({ ubicadas: 1, total: 2 });
  });
});

describe("largo con plano en el cálculo", () => {
  it("prioridad: manual > plano > estimado, y marca desde plano", () => {
    const p = proyecto([luz("l1")]);
    expect(largoDeCircuito(p.circuitos[0], p).origen).toBe("estimado");
    p.plano = { ambientes: [], tablero: { x: 0, y: 0 }, posiciones: { l1: { x: 2, y: 0 } } };
    expect(largoDeCircuito(p.circuitos[0], p)).toMatchObject({ largoM: 3.1, estimado: false, origen: "plano" });
    const r = recalcularProyecto(p);
    expect(r.circuitos[0].largoDesdePlano).toBe(true);
    expect(r.circuitos[0].largoEstimado).toBe(false);
    const manual = { ...p, circuitos: p.circuitos.map((c) => ({ ...c, largoM: 20 })) };
    expect(largoDeCircuito(manual.circuitos[0], manual).origen).toBe("manual");
  });
});

describe("plano en el backup", () => {
  it("se exporta e importa", () => {
    const p = proyecto([luz("l1")]);
    p.plano = { ambientes: [{ ambienteId: "a", x: 0, y: 0, anchoM: 4, altoM: 3 }], tablero: { x: 0.5, y: 0.5 }, posiciones: { l1: { x: 2, y: 1 } } };
    const r = importarProyecto(exportarProyecto(p));
    expect("proyecto" in r && r.proyecto.plano).toEqual(p.plano);
  });

  it("rechaza rectángulos sin tamaño", () => {
    const p = proyecto([]);
    const malo = { ...p, plano: { ambientes: [{ ambienteId: "a", x: 0, y: 0, anchoM: 0, altoM: 3 }], posiciones: {} } };
    expect(esquemaProyecto.safeParse(malo).success).toBe(false);
  });
});
