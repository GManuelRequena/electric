"use client";

import { useId } from "react";

interface Props {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  ayuda?: string;
  placeholder?: string;
  tipo?: "text" | "email" | "tel" | "password";
  multilinea?: boolean;
}

export function CampoTexto({ etiqueta, valor, onCambio, ayuda, placeholder, tipo = "text", multilinea }: Props) {
  const id = useId();
  const clases = "w-full rounded-lg border border-slate-300 bg-white px-3 text-base font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {multilinea ? (
        <textarea id={id} value={valor} placeholder={placeholder} rows={3} onChange={(e) => onCambio(e.target.value)} className={`${clases} py-2`} />
      ) : (
        <input id={id} type={tipo} value={valor} placeholder={placeholder} onChange={(e) => onCambio(e.target.value)} className={`${clases} h-12`} />
      )}
      {ayuda && <p className="text-xs text-slate-500">{ayuda}</p>}
    </div>
  );
}
