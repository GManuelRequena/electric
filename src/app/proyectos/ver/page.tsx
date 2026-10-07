import { Suspense } from "react";
import { EditorProyecto } from "@/componentes/proyecto/EditorProyecto";

export default function VerProyecto() {
  return (
    <Suspense fallback={<p className="p-4 text-slate-600">Cargando…</p>}>
      <EditorProyecto />
    </Suspense>
  );
}
