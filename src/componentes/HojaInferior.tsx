"use client";

import { useEffect } from "react";

export function HojaInferior({ abierta, titulo, onCerrar, children }: { abierta: boolean; titulo: string; onCerrar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!abierta) return;
    const alTecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [abierta, onCerrar]);

  if (!abierta) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-slate-50 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="h-11 w-11 text-2xl text-slate-500">
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
