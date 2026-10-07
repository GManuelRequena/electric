import { Suspense } from "react";
import { VistaInforme } from "@/componentes/presupuesto/VistaInforme";

export default function Informe() {
  return (
    <Suspense fallback={<p className="p-4 text-slate-600">Cargando…</p>}>
      <VistaInforme />
    </Suspense>
  );
}
