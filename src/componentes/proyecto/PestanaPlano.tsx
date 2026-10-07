"use client";

import { useRef, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { aNumero } from "@/componentes/CampoNumero";
import { HojaInferior } from "@/componentes/HojaInferior";
import { estadoPlanoDeCircuito, largoDesdePlano } from "@/dominio/circuitos/plano";
import { esBoca } from "@/dominio/circuitos/largo";
import { ajustarARejilla, limitesPlano, rectPorDefecto } from "@/dominio/proyecto/plano";
import { ALTURAS_POR_DEFECTO, type Plano, type Proyecto, type Punto } from "@/dominio/proyecto/tipos";
import { etiquetaElemento, ICONOS, nombreAmbiente } from "./etiquetas";

interface Props {
  proyecto: Proyecto;
  cambiar: (fn: (p: Proyecto) => Proyecto, recalcular?: boolean) => void;
}

type Objetivo = { tipo: "ambiente" | "elemento"; id: string } | { tipo: "tablero" };
type Colocando = { tipo: "elemento"; id: string } | { tipo: "tablero" } | null;

const ESCALA_MIN = 12;
const ESCALA_MAX = 160;
const MOVIMIENTO_MINIMO_PX = 6;
const PLANO_VACIO: Plano = { ambientes: [], posiciones: {} };

const igual = (a: Objetivo | null, b: Objetivo) => !!a && a.tipo === b.tipo && ("id" in a ? "id" in b && a.id === b.id : true);
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace(".", ",");
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Campo en metros que conserva lo que se tipea hasta salir del campo, y refleja los cambios por arrastre. */
function CampoMetros({ etiqueta, valor, onValor, minimo = 0 }: { etiqueta: string; valor: number; onValor: (n: number) => void; minimo?: number }) {
  const [texto, setTexto] = useState<string | null>(null);
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {etiqueta}
      <div className="flex h-12 items-center rounded-lg border border-slate-300 bg-white focus-within:border-amber-500">
        <input
          inputMode="decimal"
          autoComplete="off"
          aria-label={etiqueta}
          value={texto ?? fmt(valor)}
          onChange={(e) => {
            setTexto(e.target.value);
            const n = aNumero(e.target.value);
            if (n != null && n >= minimo) onValor(n);
          }}
          onBlur={() => setTexto(null)}
          className="h-full min-w-0 flex-1 rounded-lg bg-transparent px-3 text-base font-normal outline-none"
        />
        <span className="pr-3 text-sm font-normal text-slate-500">m</span>
      </div>
    </label>
  );
}

export function PestanaPlano({ proyecto: p, cambiar }: Props) {
  const plano = p.plano ?? PLANO_VACIO;
  const alturas = { ...ALTURAS_POR_DEFECTO, ...p.config.alturas };
  const [seleccion, setSeleccion] = useState<Objetivo | null>(null);
  const [colocando, setColocando] = useState<Colocando>(null);
  const [hojaAmbiente, setHojaAmbiente] = useState(false);
  const [vista, setVista] = useState(() => {
    const l = limitesPlano(p.plano);
    return { ox: l.minX - 1, oy: l.minY - 1, escala: 40 };
  });
  // Posición provisoria mientras se arrastra: se guarda recién al soltar.
  const [previa, setPrevia] = useState<{ obj: Objetivo; pos: Punto } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const punteros = useRef(new Map<number, Punto>());
  const gesto = useRef<
    | { tipo: "objeto"; obj: Objetivo; dx: number; dy: number; inicio: Punto; movido: boolean }
    | { tipo: "pan"; inicio: Punto; movido: boolean; ox: number; oy: number }
    | { tipo: "pinch"; distancia: number }
    | null
  >(null);

  const bocas = p.elementos.filter(esBoca);
  const sinUbicar = bocas.filter((e) => !plano.posiciones[e.id]);
  const ambientesFuera = p.ambientes.filter((a) => !plano.ambientes.some((r) => r.ambienteId === a.id));

  const guardarPlano = (fn: (pl: Plano) => Plano, recalcular = true) => cambiar((x) => ({ ...x, plano: fn(x.plano ?? PLANO_VACIO) }), recalcular);
  const moverObjeto = (obj: Objetivo, pos: Punto) =>
    guardarPlano((pl) => {
      if (obj.tipo === "tablero") return { ...pl, tablero: pos };
      if (obj.tipo === "elemento") return { ...pl, posiciones: { ...pl.posiciones, [obj.id]: pos } };
      return { ...pl, ambientes: pl.ambientes.map((r) => (r.ambienteId === obj.id ? { ...r, ...pos } : r)) };
    });

  const aMetros = (clientX: number, clientY: number): Punto => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: (clientX - r.left) / vista.escala + vista.ox, y: (clientY - r.top) / vista.escala + vista.oy };
  };
  const zoomEn = (factor: number, cx?: number, cy?: number) =>
    setVista((v) => {
      const r = svgRef.current!.getBoundingClientRect();
      const px = cx ?? r.width / 2;
      const py = cy ?? r.height / 2;
      const escala = limitar(v.escala * factor, ESCALA_MIN, ESCALA_MAX);
      return { escala, ox: v.ox + px / v.escala - px / escala, oy: v.oy + py / v.escala - py / escala };
    });
  const encuadrar = () => {
    const l = limitesPlano(p.plano);
    const r = svgRef.current!.getBoundingClientRect();
    const escala = limitar(Math.min(r.width / (l.maxX - l.minX + 2), r.height / (l.maxY - l.minY + 2)), ESCALA_MIN, ESCALA_MAX);
    setVista({ escala, ox: l.minX - 1, oy: l.minY - 1 });
  };

  const alBajar = (e: React.PointerEvent<SVGSVGElement>) => {
    svgRef.current!.setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      gesto.current = { tipo: "pinch", distancia: Math.hypot(a.x - b.x, a.y - b.y) };
      setPrevia(null);
      return;
    }
    const marca = (e.target as Element).closest("[data-obj]")?.getAttribute("data-obj");
    const m = aMetros(e.clientX, e.clientY);
    if (marca) {
      const [tipo, id] = marca.split(":");
      const obj: Objetivo = tipo === "tablero" ? { tipo: "tablero" } : { tipo: tipo as "ambiente" | "elemento", id };
      const origen = obj.tipo === "tablero" ? plano.tablero : obj.tipo === "elemento" ? plano.posiciones[obj.id] : plano.ambientes.find((r) => r.ambienteId === obj.id);
      if (origen) {
        gesto.current = { tipo: "objeto", obj, dx: origen.x - m.x, dy: origen.y - m.y, inicio: { x: e.clientX, y: e.clientY }, movido: false };
        return;
      }
    }
    gesto.current = { tipo: "pan", inicio: { x: e.clientX, y: e.clientY }, movido: false, ox: vista.ox, oy: vista.oy };
  };

  const alMover = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!punteros.current.has(e.pointerId)) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesto.current;
    if (!g) return;
    if (g.tipo === "pinch") {
      if (punteros.current.size < 2) return;
      const [a, b] = [...punteros.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.distancia > 0 && d > 0) {
        const r = svgRef.current!.getBoundingClientRect();
        zoomEn(d / g.distancia, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      }
      g.distancia = d;
      return;
    }
    const lejos = Math.hypot(e.clientX - g.inicio.x, e.clientY - g.inicio.y) > MOVIMIENTO_MINIMO_PX;
    if (lejos) g.movido = true;
    if (!g.movido) return;
    if (g.tipo === "pan") {
      setVista((v) => ({ ...v, ox: g.ox - (e.clientX - g.inicio.x) / v.escala, oy: g.oy - (e.clientY - g.inicio.y) / v.escala }));
    } else {
      const m = aMetros(e.clientX, e.clientY);
      setPrevia({ obj: g.obj, pos: { x: ajustarARejilla(m.x + g.dx), y: ajustarARejilla(m.y + g.dy) } });
    }
  };

  const alSoltar = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesto.current;
    punteros.current.delete(e.pointerId);
    if (g?.tipo === "pinch") {
      if (punteros.current.size === 0) gesto.current = null;
      return;
    }
    gesto.current = null;
    if (!g) return;
    if (g.tipo === "objeto") {
      setPrevia(null);
      if (g.movido) {
        if (previa) moverObjeto(previa.obj, previa.pos);
        setSeleccion(g.obj);
      } else if (colocando) colocarEn(aMetros(e.clientX, e.clientY));
      else setSeleccion(g.obj);
      return;
    }
    if (g.movido) return;
    if (colocando) colocarEn(aMetros(e.clientX, e.clientY));
    else setSeleccion(null);
  };

  const colocarEn = (m: Punto) => {
    if (!colocando) return;
    const pos = { x: ajustarARejilla(m.x), y: ajustarARejilla(m.y) };
    const obj: Objetivo = colocando.tipo === "tablero" ? { tipo: "tablero" } : colocando;
    moverObjeto(obj, pos);
    setSeleccion(obj);
    setColocando(null);
  };

  const posDe = (obj: Objetivo, base: Punto): Punto => (previa && igual(previa.obj, obj) ? previa.pos : base);
  const { ox, oy, escala } = vista;
  const px = (n: number) => n / escala; // tamaño constante en pantalla

  const quitarSeleccion = () => {
    if (!seleccion) return;
    guardarPlano((pl) => {
      if (seleccion.tipo === "tablero") return { ...pl, tablero: undefined };
      if (seleccion.tipo === "ambiente") return { ...pl, ambientes: pl.ambientes.filter((r) => r.ambienteId !== seleccion.id) };
      const resto = { ...pl.posiciones };
      delete resto[seleccion.id];
      return { ...pl, posiciones: resto };
    });
    setSeleccion(null);
  };

  const rectSel = seleccion?.tipo === "ambiente" ? plano.ambientes.find((r) => r.ambienteId === seleccion.id) : undefined;
  const puntoSel = seleccion?.tipo === "tablero" ? plano.tablero : seleccion?.tipo === "elemento" ? plano.posiciones[seleccion.id] : undefined;
  const elementoSel = seleccion?.tipo === "elemento" ? p.elementos.find((e) => e.id === seleccion.id) : undefined;
  const editarRect = (campo: "x" | "y" | "anchoM" | "altoM", v: number) =>
    seleccion?.tipo === "ambiente" && guardarPlano((pl) => ({ ...pl, ambientes: pl.ambientes.map((r) => (r.ambienteId === seleccion.id ? { ...r, [campo]: v } : r)) }));
  const editarPunto = (campo: "x" | "y", v: number) => {
    if (seleccion?.tipo === "tablero") guardarPlano((pl) => ({ ...pl, tablero: { ...(pl.tablero ?? { x: 0, y: 0 }), [campo]: v } }));
    else if (seleccion?.tipo === "elemento") guardarPlano((pl) => ({ ...pl, posiciones: { ...pl.posiciones, [seleccion.id]: { ...(pl.posiciones[seleccion.id] ?? { x: 0, y: 0 }), [campo]: v } } }));
  };

  const colocandoEtiqueta =
    colocando?.tipo === "tablero" ? "el tablero" : colocando ? (() => { const e = p.elementos.find((x) => x.id === colocando.id); return e ? `${etiquetaElemento(e)} (${nombreAmbiente(p, e.ambienteId)})` : ""; })() : "";

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl bg-white p-3 text-sm text-slate-600">
        Dibujá los ambientes, el tablero y las bocas. Con eso la app mide el cable de cada circuito sobre el plano (recorrido ortogonal desde el tablero, con subida y bajada). Un circuito usa el plano
        solo si todas sus bocas están ubicadas y no tiene un largo cargado a mano.
      </p>

      <div className="flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={() => setHojaAmbiente(true)} disabled={ambientesFuera.length === 0}>
          + Ambiente al plano
        </Boton>
        <Boton variante="secundario" onClick={() => setColocando({ tipo: "tablero" })}>
          {plano.tablero ? "Mover tablero" : "Ubicar tablero"}
        </Boton>
      </div>

      {colocando && (
        <div role="status" className="flex items-center justify-between gap-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-950">
          <span>Tocá el plano para ubicar {colocandoEtiqueta}.</span>
          <button type="button" onClick={() => setColocando(null)} className="min-h-11 px-2 font-semibold underline">
            Cancelar
          </button>
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl border border-slate-300 bg-white">
        <svg
          ref={svgRef}
          role="img"
          aria-label="Plano en planta del proyecto"
          data-testid="plano"
          className="block h-[55dvh] min-h-72 w-full select-none"
          style={{ touchAction: "none", cursor: colocando ? "crosshair" : "grab" }}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={(e) => {
            punteros.current.delete(e.pointerId);
            gesto.current = null;
            setPrevia(null);
          }}
          onWheel={(e) => {
            const r = svgRef.current!.getBoundingClientRect();
            zoomEn(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
          }}
        >
          <g transform={`scale(${escala}) translate(${-ox} ${-oy})`}>
            {escala >= 18 && (
              <>
                <pattern id="grilla" width={1} height={1} patternUnits="userSpaceOnUse">
                  <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e2e8f0" strokeWidth={px(1)} />
                </pattern>
                <rect x={-200} y={-200} width={400} height={400} fill="url(#grilla)" pointerEvents="none" />
              </>
            )}
            {plano.ambientes.map((r0) => {
              const o: Objetivo = { tipo: "ambiente", id: r0.ambienteId };
              const r = { ...r0, ...posDe(o, r0) };
              const sel = igual(seleccion, o);
              return (
                <g key={r.ambienteId} data-obj={`ambiente:${r.ambienteId}`}>
                  <rect x={r.x} y={r.y} width={r.anchoM} height={r.altoM} fill={sel ? "#fef3c7" : "#f1f5f9"} fillOpacity={0.8} stroke={sel ? "#d97706" : "#64748b"} strokeWidth={px(sel ? 3 : 2)} />
                  <text x={r.x + px(6)} y={r.y + px(16)} fontSize={px(13)} fill="#334155" fontWeight={600} pointerEvents="none">
                    {nombreAmbiente(p, r.ambienteId)}
                  </text>
                  <text x={r.x + px(6)} y={r.y + px(30)} fontSize={px(11)} fill="#64748b" pointerEvents="none">
                    {fmt(r.anchoM)} × {fmt(r.altoM)} m
                  </text>
                </g>
              );
            })}
            {bocas.map((e) => {
              const base = plano.posiciones[e.id];
              if (!base) return null;
              const o: Objetivo = { tipo: "elemento", id: e.id };
              const pos = posDe(o, base);
              const sel = igual(seleccion, o);
              return (
                <g key={e.id} data-obj={`elemento:${e.id}`} transform={`translate(${pos.x} ${pos.y})`}>
                  <circle r={px(22)} fill="transparent" />
                  <circle r={px(13)} fill="#fff" stroke={sel ? "#d97706" : "#475569"} strokeWidth={px(sel ? 3 : 1.5)} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={px(14)} pointerEvents="none">
                    {ICONOS[e.tipo]}
                  </text>
                  {e.circuitoId && (
                    <text y={px(25)} textAnchor="middle" fontSize={px(10)} fill="#334155" pointerEvents="none">
                      {e.circuitoId}
                    </text>
                  )}
                </g>
              );
            })}
            {plano.tablero && (() => {
              const o: Objetivo = { tipo: "tablero" };
              const pos = posDe(o, plano.tablero);
              const sel = igual(seleccion, o);
              return (
                <g data-obj="tablero" transform={`translate(${pos.x} ${pos.y})`}>
                  <circle r={px(26)} fill="transparent" />
                  <rect x={-px(14)} y={-px(14)} width={px(28)} height={px(28)} rx={px(4)} fill="#fbbf24" stroke={sel ? "#b45309" : "#78350f"} strokeWidth={px(sel ? 3 : 2)} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={px(14)} fontWeight={700} fill="#451a03" pointerEvents="none">
                    T
                  </text>
                </g>
              );
            })()}
          </g>
        </svg>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button type="button" aria-label="Acercar" onClick={() => zoomEn(1.25)} className="size-11 rounded-lg bg-white text-xl shadow ring-1 ring-slate-300">
            +
          </button>
          <button type="button" aria-label="Alejar" onClick={() => zoomEn(0.8)} className="size-11 rounded-lg bg-white text-xl shadow ring-1 ring-slate-300">
            −
          </button>
          <button type="button" aria-label="Encuadrar todo" onClick={encuadrar} className="size-11 rounded-lg bg-white text-lg shadow ring-1 ring-slate-300">
            ⤢
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">Arrastrá para mover la vista o un objeto (rejilla de 0,1 m). Pellizcá o usá + / − para el zoom. Un toque selecciona.</p>

      {seleccion && (
        <section aria-label="Objeto seleccionado" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">
            {seleccion.tipo === "ambiente" ? nombreAmbiente(p, seleccion.id) : seleccion.tipo === "tablero" ? "Tablero" : elementoSel ? `${etiquetaElemento(elementoSel)} · ${nombreAmbiente(p, elementoSel.ambienteId)}` : "Elemento"}
          </h2>
          {rectSel && (
            <div className="grid grid-cols-2 gap-2">
              <CampoMetros etiqueta="Izquierda (x)" valor={rectSel.x} onValor={(v) => editarRect("x", v)} />
              <CampoMetros etiqueta="Arriba (y)" valor={rectSel.y} onValor={(v) => editarRect("y", v)} />
              <CampoMetros etiqueta="Ancho" valor={rectSel.anchoM} minimo={0.1} onValor={(v) => editarRect("anchoM", v)} />
              <CampoMetros etiqueta="Alto" valor={rectSel.altoM} minimo={0.1} onValor={(v) => editarRect("altoM", v)} />
            </div>
          )}
          {puntoSel && (
            <div className="grid grid-cols-2 gap-2">
              <CampoMetros etiqueta="Posición x" valor={puntoSel.x} onValor={(v) => editarPunto("x", v)} />
              <CampoMetros etiqueta="Posición y" valor={puntoSel.y} onValor={(v) => editarPunto("y", v)} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {seleccion.tipo === "elemento" && (
              <Boton variante="secundario" onClick={() => setColocando({ tipo: "elemento", id: seleccion.id })}>
                Cambiar de lugar
              </Boton>
            )}
            <Boton variante="peligro" onClick={quitarSeleccion}>
              Quitar del plano
            </Boton>
          </div>
        </section>
      )}

      <section aria-label="Bocas sin ubicar" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Bocas sin ubicar ({sinUbicar.length})</h2>
        {sinUbicar.length === 0 ? (
          <p className="text-sm text-slate-600">{bocas.length === 0 ? "Todavía no cargaste bocas en los ambientes." : "Todas las bocas están en el plano."}</p>
        ) : (
          <>
            <p className="text-sm text-slate-600">Tocá una boca y después tocá el lugar del plano.</p>
            <ul className="flex flex-wrap gap-2">
              {sinUbicar.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-pressed={colocando?.tipo === "elemento" && colocando.id === e.id}
                    onClick={() => setColocando({ tipo: "elemento", id: e.id })}
                    className={`min-h-11 rounded-lg px-3 text-sm ${colocando?.tipo === "elemento" && colocando.id === e.id ? "bg-amber-500 font-semibold" : "bg-slate-100"}`}
                  >
                    {ICONOS[e.tipo]} {etiquetaElemento(e)} · {nombreAmbiente(p, e.ambienteId)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="Largos desde el plano" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Largos por circuito</h2>
        {p.circuitos.length === 0 && <p className="text-sm text-slate-600">Cuando haya circuitos vas a ver acá su largo.</p>}
        <ul className="flex flex-col gap-1 text-sm">
          {p.circuitos.map((c) => {
            const est = estadoPlanoDeCircuito(p, c.id);
            const r = largoDesdePlano(c.id, p);
            const manual = c.largoM != null && c.largoM > 0;
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-medium">{c.id}</span>
                <span className="text-right text-slate-700">
                  {r ? `${fmt(r.largoM)} m desde plano` : `${est.ubicadas} de ${est.total} bocas ubicadas${plano.tablero ? "" : " · falta el tablero"}`}
                  {manual && r ? " (usa el largo cargado a mano)" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Alturas de montaje" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Alturas de montaje</h2>
        <p className="text-sm text-slate-600">Parámetros de la app para la subida y bajada del cable (no son valores de la norma). Ajustalos a tu obra.</p>
        <div className="grid grid-cols-3 gap-2">
          <CampoMetros etiqueta="Tablero" valor={alturas.tableroM} onValor={(v) => cambiar((x) => ({ ...x, config: { ...x.config, alturas: { ...alturas, tableroM: v } } }))} />
          <CampoMetros etiqueta="Luces / fijos" valor={alturas.techoM} onValor={(v) => cambiar((x) => ({ ...x, config: { ...x.config, alturas: { ...alturas, techoM: v } } }))} />
          <CampoMetros etiqueta="Tomas" valor={alturas.tomaM} onValor={(v) => cambiar((x) => ({ ...x, config: { ...x.config, alturas: { ...alturas, tomaM: v } } }))} />
        </div>
      </section>

      <HojaInferior abierta={hojaAmbiente} titulo="Agregar ambiente al plano" onCerrar={() => setHojaAmbiente(false)}>
        <ul className="flex flex-col gap-2">
          {ambientesFuera.map((a) => (
            <li key={a.id}>
              <Boton
                variante="secundario"
                className="w-full text-left"
                onClick={() => {
                  guardarPlano((pl) => ({ ...pl, ambientes: [...pl.ambientes, rectPorDefecto({ ...p, plano: pl }, a.id)] }), false);
                  setSeleccion({ tipo: "ambiente", id: a.id });
                  setHojaAmbiente(false);
                }}
              >
                {a.nombre}
              </Boton>
            </li>
          ))}
        </ul>
      </HojaInferior>
    </div>
  );
}
