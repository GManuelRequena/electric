import { describe, expect, it } from "vitest";
import { aea770 } from "../calculo";
import { modeloUnifilar } from "../proyecto/unifilar";
import { proyectoNuevo, type Elemento, type Proyecto, type TipoElemento } from "../proyecto/tipos";
import { asignarCircuitos, liberarElemento, moverElemento } from "./asignar";
import { recalcularProyecto } from "./calcular";
import { estimarLargo } from "./largo";
import { validarProyecto } from "./validar";

let n = 0;
const el = (tipo: TipoElemento, ambienteId: string, extra: Partial<Elemento> = {}): Elemento => ({ id: `e${++n}`, tipo, ambienteId, ...extra });

function base(): Proyecto {
  const p = proyectoNuevo({ nombre: "Prueba", superficieM2: 80, sistema: "monofasico" }, "2026-01-01T00:00:00.000Z");
  p.ambientes = [
    { id: "coc", nombre: "Cocina", tipo: "cocina" },
    { id: "dor", nombre: "Dormitorio", tipo: "dormitorio" },
  ];
  return p;
}

const ducha = (id = "d1") => ({ id, nombre: "Ducha eléctrica", potenciaW: 3500, cosPhi: 1, cantidad: 1, simultaneo: true, requiereCircuitoPropio: true, categoria: "fijo" as const });

describe("asignarCircuitos", () => {
  it("separa luces y tomas generales en circuitos distintos", () => {
    const p = { ...base(), elementos: [el("boca_luz", "coc"), el("toma_general", "coc"), el("boca_luz", "dor"), el("toma_general", "dor")] };
    const r = asignarCircuitos(p);
    expect(r.circuitos.map((c) => c.id)).toEqual(["IUG1", "TUG1"]);
    expect(r.elementos.filter((e) => e.tipo === "boca_luz").every((e) => e.circuitoId === "IUG1")).toBe(true);
    expect(r.elementos.filter((e) => e.tipo === "toma_general").every((e) => e.circuitoId === "TUG1")).toBe(true);
  });

  it("abre otro circuito al superar el máximo de bocas de la tabla", () => {
    const max = aea770.tiposCircuito.filas.find((f) => f.tipo === "IUG")!.maxBocas!;
    const p = { ...base(), elementos: Array.from({ length: max + 1 }, () => el("boca_luz", "dor")) };
    const r = asignarCircuitos(p);
    expect(r.circuitos.map((c) => c.id)).toEqual(["IUG1", "IUG2"]);
    expect(r.elementos.filter((e) => e.circuitoId === "IUG1")).toHaveLength(max);
    expect(r.elementos.filter((e) => e.circuitoId === "IUG2")).toHaveLength(1);
  });

  it("abre otro circuito al superar la corriente máxima del tipo", () => {
    // TUG: 20 A máx. Tres tomas con 1200 W (5,45 A) → 16,4 A entran; la cuarta pasa de 20 A.
    const tomas = Array.from({ length: 4 }, (_, i) => el("toma_general", "coc", { id: `t${i}` }));
    const enchufados = tomas.map((t, i) =>
      el("artefacto", "coc", { enchufadoEn: t.id, artefacto: { id: `a${i}`, nombre: "Microondas", potenciaW: 1200, cosPhi: 1, cantidad: 1, simultaneo: true } }),
    );
    const r = asignarCircuitos({ ...base(), elementos: [...tomas, ...enchufados] });
    expect(r.circuitos.map((c) => c.id)).toEqual(["TUG1", "TUG2"]);
    // lo enchufado sigue a su toma
    for (const e of r.elementos.filter((x) => x.enchufadoEn)) expect(e.circuitoId).toBe(r.elementos.find((t) => t.id === e.enchufadoEn)!.circuitoId);
  });

  it("deja un artefacto con circuito propio solo en un TUE", () => {
    const p = { ...base(), elementos: [el("artefacto", "dor", { artefacto: ducha("d1") }), el("artefacto", "coc", { artefacto: ducha("d2") }), el("toma_general", "coc")] };
    const r = asignarCircuitos(p);
    expect(r.circuitos.map((c) => c.id)).toEqual(["TUG1", "TUE1", "TUE2"]);
    expect(r.circuitos.find((c) => c.id === "TUE1")!.tipo).toBe("TUE");
  });

  it("un artefacto muy grande va a una alimentación de carga única (ACU)", () => {
    const horno = { ...ducha(), nombre: "Horno trifásico grande", potenciaW: 6000 };
    const r = asignarCircuitos({ ...base(), elementos: [el("artefacto", "coc", { artefacto: horno })] });
    expect(r.circuitos.map((c) => c.tipo)).toEqual(["ACU"]);
  });

  it("una luminaria fija suma como boca de iluminación", () => {
    const vent = { id: "v", nombre: "Ventilador", potenciaW: 80, cosPhi: 0.9, cantidad: 1, simultaneo: true, categoria: "iluminacion" as const };
    const r = asignarCircuitos({ ...base(), elementos: [el("artefacto", "dor", { artefacto: vent }), el("boca_luz", "dor")] });
    expect(r.circuitos.map((c) => c.id)).toEqual(["IUG1"]);
  });

  it("respeta las asignaciones manuales al reasignar", () => {
    const t1 = el("toma_general", "coc");
    const t2 = el("toma_general", "dor");
    let p = asignarCircuitos({ ...base(), elementos: [t1, t2] });
    p = moverElemento(p, t2.id, { nuevoTipo: "TUG" });
    expect(p.elementos.find((e) => e.id === t2.id)).toMatchObject({ circuitoId: "TUG2", asignacionManual: true });
    // se agrega otra toma y se reasigna: la manual no se mueve y la nueva completa TUG1
    p = asignarCircuitos({ ...p, elementos: [...p.elementos, el("toma_general", "coc")] });
    expect(p.elementos.find((e) => e.id === t2.id)!.circuitoId).toBe("TUG2");
    expect(p.circuitos.map((c) => c.id)).toEqual(["TUG1", "TUG2"]);
    // liberada, vuelve a TUG1
    p = asignarCircuitos(liberarElemento(p, t2.id));
    expect(p.circuitos.map((c) => c.id)).toEqual(["TUG1"]);
  });

  it("las teclas siguen al circuito de la luz que comandan", () => {
    const luz = el("boca_luz", "dor");
    const tecla = el("tecla_simple", "dor", { comandaA: [luz.id] });
    const r = asignarCircuitos({ ...base(), elementos: [luz, tecla] });
    expect(r.elementos.find((e) => e.id === tecla.id)!.circuitoId).toBe("IUG1");
    expect(r.circuitos).toHaveLength(1); // la tecla no cuenta como boca
  });
});

describe("estimarLargo y cálculo", () => {
  it("usa la config y marca largoEstimado", () => {
    const p = recalcularProyecto({ ...base(), config: { metrosPorBoca: 3, metrosHastaTablero: 10 }, elementos: [el("boca_luz", "dor"), el("boca_luz", "dor")] });
    expect(estimarLargo(p.circuitos[0], p)).toBe(2 * 3 + 10);
    expect(p.circuitos[0].largoEstimado).toBe(true);
    expect(p.circuitos[0].resultado?.advertencias.some((a) => a.includes("estimación"))).toBe(true);
  });

  it("con largo cargado a mano no es estimado", () => {
    const p0 = asignarCircuitos({ ...base(), elementos: [el("boca_luz", "dor")] });
    const p = recalcularProyecto({ ...p0, circuitos: p0.circuitos.map((c) => ({ ...c, largoM: 12 })) });
    expect(p.circuitos[0].largoEstimado).toBe(false);
    expect(p.circuitos[0].resultado?.caidaTensionPct).toBeGreaterThan(0);
  });

  it("calcula cada circuito con el motor: bocas de luz a 60 VA y demanda mínima de los TUG", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("boca_luz", "dor"), el("boca_luz", "dor"), el("toma_general", "coc")] });
    const iug = p.circuitos.find((c) => c.id === "IUG1")!.resultado!;
    expect(iug.potenciaTotalW).toBe(120);
    const tug = p.circuitos.find((c) => c.id === "TUG1")!.resultado!;
    expect(tug.potenciaTotalW).toBe(2200);
    expect(tug.corrienteProyectoA).toBeCloseTo(10, 1);
  });

  it("usa la carga real si supera la demanda mínima", () => {
    const t = el("toma_general", "coc", { id: "tx" });
    const a = el("artefacto", "coc", { enchufadoEn: "tx", artefacto: { id: "p", nombre: "Pava", potenciaW: 3000, cosPhi: 1, cantidad: 1, simultaneo: true } });
    const p = recalcularProyecto({ ...base(), elementos: [t, a] });
    expect(p.circuitos[0].resultado!.potenciaTotalW).toBe(3000);
  });
});

describe("validarProyecto", () => {
  it("detecta las bocas mínimas que faltan, citando la norma y si está verificada", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("boca_luz", "coc")] });
    const h = validarProyecto(p).find((x) => x.ambienteId === "coc" && x.severidad === "error")!;
    expect(h.mensaje).toMatch(/Cocina: faltan 2 tomas generales \(TUG\)/);
    expect(h.fuente?.referencia).toMatch(/770\.7\.I/);
    expect(h.verificado).toBe(false);
  });

  it("no marca error cuando se cumple el mínimo", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("boca_luz", "coc"), el("toma_general", "coc"), el("toma_general", "coc")] });
    expect(validarProyecto(p).filter((x) => x.ambienteId === "coc" && x.severidad === "error")).toEqual([]);
  });

  it("avisa que faltan mínimos cargados para ambientes sin reglas", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("boca_luz", "dor")] });
    expect(validarProyecto(p).some((x) => x.ambienteId === "dor" && x.mensaje.includes("PENDIENTE_VERIFICAR"))).toBe(true);
  });

  it("valida los circuitos mínimos del grado cuando la tabla los tiene", () => {
    const filas = aea770.gradosElectrificacion.filas.map((f) => ({ ...f, circuitosMinimos: 4 }));
    const norma = { ...aea770, gradosElectrificacion: { ...aea770.gradosElectrificacion, filas } };
    const p = recalcularProyecto({ ...base(), elementos: [el("boca_luz", "dor")] }, norma);
    expect(validarProyecto(p, norma).some((h) => h.severidad === "error" && h.mensaje.includes("al menos 4 circuitos"))).toBe(true);
    // con la tabla actual (null) solo informa el pendiente
    expect(validarProyecto(p).some((h) => h.mensaje.includes("Tabla 770.7.II"))).toBe(true);
  });

  it("detecta Ib > In", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("toma_general", "coc")] });
    const c = p.circuitos[0];
    const roto = { ...p, circuitos: [{ ...c, resultado: { ...c.resultado!, corrienteProyectoA: 25, termicaA: 20 } }] };
    expect(validarProyecto(roto).some((h) => h.severidad === "error" && h.circuitoId === "TUG1" && h.mensaje.includes("Ib ≤ In"))).toBe(true);
  });

  it("detecta exceso de bocas, luces en un TUG, diferencial grande y falta de PAT", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("toma_general", "coc")] });
    const malo: Proyecto = {
      ...p,
      elementos: [...p.elementos, el("boca_luz", "coc", { circuitoId: "TUG1" })],
      tablero: { principal: { diferencialMa: 300 }, puestaATierra: false },
    };
    const msgs = validarProyecto(malo).filter((h) => h.severidad === "error").map((h) => h.mensaje);
    expect(msgs.some((m) => m.includes("bocas de luz en un circuito de tomacorrientes"))).toBe(true);
    expect(msgs.some((m) => m.includes("300 mA"))).toBe(true);
    expect(msgs.some((m) => m.includes("puesta a tierra"))).toBe(true);
  });
});

describe("modeloUnifilar", () => {
  it("arma acometida → tablero → circuitos", () => {
    const p = recalcularProyecto({ ...base(), elementos: [el("boca_luz", "dor"), el("toma_general", "dor")] });
    const u = modeloUnifilar(p);
    expect(u.tipo).toBe("acometida");
    expect(u.hijos[0].tipo).toBe("tablero");
    expect(u.hijos[0].hijos.map((c) => c.etiqueta)).toEqual(["IUG1", "TUG1"]);
    expect(u.hijos[0].hijos[0].detalle.join(" ")).toMatch(/mm²/);
  });
});
