"use client";

import { useId } from "react";

interface Props<T extends string> {
  etiqueta: string;
  valor: T;
  opciones: { valor: T; texto: string }[];
  onCambio: (v: T) => void;
  ayuda?: string;
}

export function Selector<T extends string>({ etiqueta, valor, opciones, onCambio, ayuda }: Props<T>) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onCambio(e.target.value as T)}
        className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
    </div>
  );
}

/** Dos o tres botones grandes en fila (por ejemplo monofásico / trifásico). */
export function Segmentado<T extends string>({ etiqueta, valor, opciones, onCambio }: Omit<Props<T>, "ayuda">) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
      <div role="group" aria-label={etiqueta} className="flex gap-1 rounded-lg bg-slate-200 p-1">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={valor === o.valor}
            onClick={() => onCambio(o.valor)}
            className={`h-11 flex-1 rounded-md px-2 text-sm font-medium ${valor === o.valor ? "bg-white shadow text-slate-900" : "text-slate-600"}`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
