import type { ResultadoCircuito } from "@/dominio/calculo";
import { fmt, semaforoCaida, type Semaforo } from "@/dominio/calculo";

export { semaforoCaida, type Semaforo };

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
