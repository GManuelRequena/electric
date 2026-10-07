"use client";

import { useState } from "react";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { modeloUnifilar } from "@/dominio/proyecto/unifilar";
import type { Proyecto } from "@/dominio/proyecto/tipos";
import { Unifilar } from "./Unifilar";

interface Props {
  proyecto: Proyecto;
  cambiar: (fn: (p: Proyecto) => Proyecto, recalcular?: boolean) => void;
}

const texto = (n: number | undefined) => (n == null ? "" : String(n).replace(".", ","));
const positivo = (s: string) => {
  const n = aNumero(s);
  return n != null && n > 0 ? n : undefined;
};

export function PestanaTablero({ proyecto: p, cambiar }: Props) {
  // Texto de los campos mientras se escribe (para poder borrar y volver a tipear).
  const [edit, setEdit] = useState<Record<string, string>>({});
  const campo = (k: string, actual: number | undefined) => edit[k] ?? texto(actual);
  const poner = (k: string, v: string) => setEdit((e) => ({ ...e, [k]: v }));

  return (
    <div className="flex flex-col gap-4">
      <Unifilar raiz={modeloUnifilar(p)} />

      <section aria-label="Protecciones del tablero" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Protecciones</h2>
        <CampoNumero
          etiqueta="Térmica general"
          unidad="A"
          valor={campo("termica", p.tablero.principal.termicaA)}
          onCambio={(v) => {
            poner("termica", v);
            cambiar((x) => ({ ...x, tablero: { ...x.tablero, principal: { ...x.tablero.principal, termicaA: positivo(v) } } }), false);
          }}
        />
        <CampoNumero
          etiqueta="Diferencial"
          unidad="mA"
          valor={campo("dif", p.tablero.principal.diferencialMa)}
          ayuda="Vacío = sin diferencial. La Guía exige 30 mA en iluminación y tomacorrientes."
          onCambio={(v) => {
            poner("dif", v);
            cambiar((x) => ({ ...x, tablero: { ...x.tablero, principal: { ...x.tablero.principal, diferencialMa: positivo(v) } } }), false);
          }}
        />
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="size-5" checked={p.tablero.puestaATierra} onChange={(e) => cambiar((x) => ({ ...x, tablero: { ...x.tablero, puestaATierra: e.target.checked } }), false)} />
          Tiene puesta a tierra (PE)
        </label>
      </section>

      <section aria-label="Estimación de largos" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Estimación de largos</h2>
        <p className="text-sm text-slate-600">Cuando no cargás el largo de un circuito se estima: bocas × metros por boca + metros hasta el tablero.</p>
        <div className="grid grid-cols-2 gap-2">
          <CampoNumero
            etiqueta="Metros por boca"
            unidad="m"
            valor={campo("mxb", p.config.metrosPorBoca)}
            onCambio={(v) => {
              poner("mxb", v);
              cambiar((x) => ({ ...x, config: { ...x.config, metrosPorBoca: aNumero(v) != null && aNumero(v)! >= 0 ? aNumero(v)! : x.config.metrosPorBoca } }));
            }}
          />
          <CampoNumero
            etiqueta="Hasta el tablero"
            unidad="m"
            valor={campo("mht", p.config.metrosHastaTablero)}
            onCambio={(v) => {
              poner("mht", v);
              cambiar((x) => ({ ...x, config: { ...x.config, metrosHastaTablero: aNumero(v) != null && aNumero(v)! >= 0 ? aNumero(v)! : x.config.metrosHastaTablero } }));
            }}
          />
        </div>
      </section>
    </div>
  );
}
