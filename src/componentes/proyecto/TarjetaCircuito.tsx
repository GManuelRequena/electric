"use client";

import { useState } from "react";
import { aNumero } from "@/componentes/CampoNumero";
import { DetalleCircuito } from "@/componentes/DetalleCircuito";
import { fmt, aea770, type TipoCircuito } from "@/dominio/calculo";
import type { Destino } from "@/dominio/circuitos/asignar";
import { contarBocas, elementosDeCircuito, esBoca, estimarLargo } from "@/dominio/circuitos/largo";
import { largoDesdePlano } from "@/dominio/circuitos/plano";
import type { Circuito, Proyecto } from "@/dominio/proyecto/tipos";
import { etiquetaElemento, nombreAmbiente } from "./etiquetas";

const NUEVOS: TipoCircuito[] = ["IUG", "TUG", "TUE"];

interface Props {
  circuito: Circuito;
  proyecto: Proyecto;
  abierta: boolean;
  onAlternar: () => void;
  onLargo: (largoM: number | undefined) => void;
  onMover: (elementoId: string, destino: Destino) => void;
  onLiberar: (elementoId: string) => void;
}

export function TarjetaCircuito({ circuito: c, proyecto: p, abierta, onAlternar, onLargo, onMover, onLiberar }: Props) {
  const r = c.resultado;
  const nombreTipo = aea770.tiposCircuito.filas.find((f) => f.tipo === c.tipo)?.nombre ?? c.tipo;
  const [largoTexto, setLargoTexto] = useState<string | null>(null);
  const desdePlano = largoDesdePlano(c.id, p);
  const largoMostrado = largoTexto ?? (c.largoM != null ? String(c.largoM).replace(".", ",") : "");
  const elementos = elementosDeCircuito(p, c.id);
  const otros = p.circuitos.filter((x) => x.id !== c.id);

  return (
    <article id={`circuito-${c.id}`} className={`rounded-xl border-2 bg-white ${r?.cumple ? "border-emerald-500" : "border-amber-500"}`}>
      <button type="button" onClick={onAlternar} aria-expanded={abierta} className="flex min-h-14 w-full flex-col gap-0.5 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-lg font-bold">
          <span aria-hidden>{r?.cumple ? "✓" : "⚠"}</span>
          {c.id}
          <span className="text-sm font-normal text-slate-600">{nombreTipo}</span>
        </span>
        {r ? (
          <span className="text-sm text-slate-700">
            {contarBocas(p, c.id)} bocas · Ib {fmt(r.corrienteProyectoA)} A · Cable {fmt(r.seccionMm2)} mm² · Térmica {r.termicaA} A {r.curva}
          </span>
        ) : (
          <span className="text-sm text-amber-800">{c.error ?? "Sin calcular"}</span>
        )}
      </button>
      {abierta && (
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Largo del circuito {c.largoEstimado && <span className="ml-1 rounded bg-amber-100 px-1.5 text-xs text-amber-900">estimado</span>}
            {c.largoDesdePlano && <span className="ml-1 rounded bg-sky-100 px-1.5 text-xs text-sky-900">desde plano</span>}
            <div className="flex h-12 items-center rounded-lg border border-slate-300 bg-white focus-within:border-amber-500">
              <input
                inputMode="decimal"
                autoComplete="off"
                aria-label={`Largo de ${c.id}`}
                value={largoMostrado}
                placeholder={desdePlano ? `${fmt(desdePlano.largoM)} (desde plano)` : `${fmt(estimarLargo(c, p))} (estimado)`}
                onChange={(e) => {
                  setLargoTexto(e.target.value);
                  const n = aNumero(e.target.value);
                  onLargo(n != null && n > 0 ? n : undefined);
                }}
                className="h-full min-w-0 flex-1 rounded-lg bg-transparent px-3 text-base font-normal outline-none"
              />
              <span className="pr-3 text-sm font-normal text-slate-500">m</span>
            </div>
          </label>

          <ul aria-label={`Elementos de ${c.id}`} className="flex flex-col gap-2">
            {elementos.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 rounded-lg bg-slate-50 p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {e.enchufadoEn ? "↳ " : ""}
                    {etiquetaElemento(e)} <span className="text-slate-500">· {nombreAmbiente(p, e.ambienteId)}</span>
                    {e.asignacionManual && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs">manual</span>}
                  </span>
                  {e.asignacionManual && (
                    <button type="button" onClick={() => onLiberar(e.id)} className="min-h-11 px-2 text-xs text-slate-600 underline">
                      Automático
                    </button>
                  )}
                </div>
                {esBoca(e) && (
                  <select
                    aria-label={`Mover ${etiquetaElemento(e)} de ${nombreAmbiente(p, e.ambienteId)} a...`}
                    value=""
                    onChange={(ev) => {
                      const v = ev.target.value;
                      if (!v) return;
                      onMover(e.id, v.startsWith("nuevo:") ? { nuevoTipo: v.slice(6) as TipoCircuito } : { circuitoId: v });
                    }}
                    className="h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm"
                  >
                    <option value="">Mover a...</option>
                    {otros.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id}
                      </option>
                    ))}
                    {NUEVOS.map((t) => (
                      <option key={t} value={`nuevo:${t}`}>
                        Circuito nuevo {t}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>

          {r && <DetalleCircuito r={r} />}
        </div>
      )}
    </article>
  );
}
