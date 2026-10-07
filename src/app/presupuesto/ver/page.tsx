import { Suspense } from "react";
import { EditorPresupuesto } from "@/componentes/presupuesto/EditorPresupuesto";

export default function VerPresupuesto() {
  return (
    <Suspense fallback={<p className="p-4 text-slate-600">Cargando…</p>}>
      <EditorPresupuesto />
    </Suspense>
  );
}
