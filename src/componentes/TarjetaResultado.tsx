import type { ResultadoCircuito } from "@/dominio/calculo";
import { fmt } from "@/dominio/calculo";

export type Semaforo = "verde" | "ambar" | "rojo";

/** Verde si cumple con margen, ámbar si cumple pero usa más del 90 % del límite, rojo si lo supera. */
export function semaforoCaida(pct: number, limitePct: number): Semaforo {
  if (pct > limitePct) return "rojo";
  return pct > 0.9 * limitePct ? "ambar" : "verde";
}

const COLORES: Record<Semaforo, string> = {
  verde: "bg-emerald-500",
  ambar: "bg-amber-400",
  rojo: "bg-red-500",
};

export function PuntoSemaforo({ estado }: { estado: Semaforo }) {
  const texto = { verde: "Cumple", ambar: "Cumple justo", rojo: "No cumple" }[estado];
  return <span role="img" aria-label={texto} title={texto} className={`inline-block size-3 rounded-full ${COLORES[estado]}`} />;
}

/** Resumen fijo abajo: "Cable 2,5 mm² · Térmica 16 A C · Diferencial 30 mA". */
export function TarjetaResultado({ r }: { r: ResultadoCircuito }) {
  return (
    <div
      aria-live="polite"
      data-testid="resumen"
      className={`rounded-xl border-2 bg-white px-4 py-3 shadow-lg ${r.cumple ? "border-emerald-500" : "border-amber-500"}`}
    >
      <p className="flex items-center gap-2 text-lg font-bold">
        <span aria-hidden>{r.cumple ? "✓" : "⚠"}</span>
        Cable {fmt(r.seccionMm2)} mm² · Térmica {r.termicaA} A {r.curva}
      </p>
      <p className="text-sm text-slate-700">
        Diferencial {r.diferencial.sensibilidadMa} mA · Ib {fmt(r.corrienteProyectoA)} A · {r.tipoCircuitoSugerido}
        {r.caidaTensionPct != null && ` · Caída ${fmt(r.caidaTensionPct)} %`}
      </p>
    </div>
  );
}
