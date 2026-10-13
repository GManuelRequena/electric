"use client";

import { useId } from "react";

/** Convierte "1,5" o "1.5" en número; vacío o inválido → undefined. */
export function aNumero(texto: string): number | undefined {
  const n = Number(texto.trim().replace(",", "."));
  return texto.trim() === "" || !Number.isFinite(n) ? undefined : n;
}

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  unidad?: string;
  ayuda?: string;
  placeholder?: string;
  /** Dato protagonista de la pantalla: más grande y con el foco al abrirla. */
  principal?: boolean;
}

export function CampoNumero({ etiqueta, valor, onCambio, unidad, ayuda, placeholder, principal }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <div className={`flex items-center rounded-lg ${principal ? "h-16" : "h-12"} border border-slate-300 bg-superficie focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200`}>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={principal}
          value={valor}
          placeholder={placeholder}
          onChange={(e) => onCambio(e.target.value)}
          className={`h-full min-w-0 flex-1 rounded-lg bg-transparent px-3 outline-none tabular-nums ${principal ? "text-3xl font-semibold" : "text-base"}`}
        />
        {unidad && <span className="pr-3 text-sm text-slate-500">{unidad}</span>}
      </div>
      {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
    </div>
  );
}
