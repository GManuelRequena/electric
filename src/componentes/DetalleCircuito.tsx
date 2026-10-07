import type { ResultadoCircuito } from "@/dominio/calculo";
import { fmt } from "@/dominio/calculo";
import { AvisoNoVerificado } from "./AvisoNoVerificado";
import { PasoAPaso } from "./PasoAPaso";
import { PuntoSemaforo, semaforoCaida } from "./TarjetaResultado";

const MOTIVOS = {
  minima_norma: "mínima de la norma",
  corriente: "corriente admisible (Iz)",
  caida_tension: "caída de tensión",
} as const;

export function DetalleCircuito({ r }: { r: ResultadoCircuito }) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <Dato t="Potencia considerada" v={`${fmt(r.potenciaTotalW, 0)} W`} />
        <Dato t="Corriente Ib" v={`${fmt(r.corrienteProyectoA)} A`} />
        <Dato t="Sección" v={`${fmt(r.seccionMm2)} mm²`} />
        <Dato t="Fijada por" v={MOTIVOS[r.motivoSeccion]} />
        <Dato t="Iz del cable" v={`${fmt(r.corrienteAdmisibleA)} A`} />
        <Dato t="Térmica In" v={`${r.termicaA} A curva ${r.curva}`} />
        {r.capacidadCorteKa != null && <Dato t="Capacidad de corte" v={`${fmt(r.capacidadCorteKa)} kA`} />}
        <Dato t="Diferencial" v={`${r.diferencial.sensibilidadMa} mA${r.diferencial.obligatorio ? " (obligatorio)" : ""}`} />
        {r.caidaTensionPct != null && r.limiteCaidaPct != null && (
          <div className="col-span-2 flex items-center gap-2">
            <PuntoSemaforo estado={semaforoCaida(r.caidaTensionPct, r.limiteCaidaPct)} />
            <span>
              Caída {fmt(r.caidaTensionV ?? 0)} V = {fmt(r.caidaTensionPct)} % (límite {fmt(r.limiteCaidaPct)} %)
            </span>
          </div>
        )}
        {r.tensionExtremoV != null && <Dato t="Tensión en el extremo" v={`${fmt(r.tensionExtremoV)} V`} />}
      </dl>
      {r.advertencias.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Advertencias">
          {r.advertencias.map((a) => (
            <li key={a}>
              <AvisoNoVerificado>{a}</AvisoNoVerificado>
            </li>
          ))}
        </ul>
      )}
      <PasoAPaso pasos={r.pasos} />
    </div>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{t}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
