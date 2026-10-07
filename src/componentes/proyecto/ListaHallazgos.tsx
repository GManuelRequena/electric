import { Cita } from "@/componentes/Cita";
import type { Hallazgo } from "@/dominio/circuitos/validar";

const GRUPOS: { sev: Hallazgo["severidad"]; titulo: string; icono: string; clase: string }[] = [
  { sev: "error", titulo: "Errores", icono: "✕", clase: "border-red-300 bg-red-50 text-red-900" },
  { sev: "advertencia", titulo: "Advertencias", icono: "⚠", clase: "border-amber-300 bg-amber-50 text-amber-900" },
  { sev: "info", titulo: "Información", icono: "ℹ", clase: "border-slate-200 bg-white text-slate-800" },
];

interface Props {
  hallazgos: Hallazgo[];
  onIrAmbiente: (id: string) => void;
  onIrCircuito: (id: string) => void;
}

export function ListaHallazgos({ hallazgos, onIrAmbiente, onIrCircuito }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {GRUPOS.map((g) => {
        const lista = hallazgos.filter((h) => h.severidad === g.sev);
        if (lista.length === 0) return null;
        return (
          <section key={g.sev} aria-label={g.titulo} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              {g.titulo} ({lista.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {lista.map((h, i) => (
                <li key={i} className={`flex flex-col gap-2 rounded-xl border p-3 text-sm ${g.clase}`}>
                  <p className="flex gap-2">
                    <span aria-hidden>{g.icono}</span>
                    <span>{h.mensaje}</span>
                  </p>
                  {h.verificado === false && (
                    <p role="note" className="rounded-lg bg-amber-100 px-2 py-1 text-xs text-amber-900">
                      ⚠ Se apoya en un valor de la norma sin verificar.
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {h.fuente && <Cita fuente={h.fuente} />}
                    {h.ambienteId && (
                      <button type="button" onClick={() => onIrAmbiente(h.ambienteId!)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800">
                        Ir al ambiente
                      </button>
                    )}
                    {h.circuitoId && (
                      <button type="button" onClick={() => onIrCircuito(h.circuitoId!)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800">
                        Ir al circuito
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {hallazgos.filter((h) => h.severidad !== "info").length === 0 && (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">✓ Sin errores ni advertencias. Revisá igual los valores sin verificar.</p>
      )}
    </div>
  );
}
