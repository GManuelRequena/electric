import type { Paso } from "@/dominio/calculo";
import { AvisoNoVerificado } from "./AvisoNoVerificado";
import { Cita } from "./Cita";

export function PasoAPaso({ pasos, titulo = "Ver cálculo paso a paso" }: { pasos: Paso[]; titulo?: string }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white">
      <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 text-base font-medium">
        {titulo}
        <span aria-hidden className="text-slate-400 transition group-open:rotate-90">
          ›
        </span>
      </summary>
      <ol className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4">
        {pasos.map((p, i) => (
          <li key={i} className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-slate-900">
              {i + 1}. {p.titulo}
            </h3>
            {p.formula && <p className="font-mono text-sm text-slate-700">{p.formula}</p>}
            <p className="text-sm text-slate-700">{p.detalle}</p>
            {p.fuente && <Cita fuente={p.fuente} />}
            {p.advertencia && <AvisoNoVerificado>{p.advertencia}</AvisoNoVerificado>}
          </li>
        ))}
      </ol>
    </details>
  );
}
