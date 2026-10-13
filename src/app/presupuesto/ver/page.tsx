import { Suspense } from "react";
import { EsqueletoPagina } from "@/componentes/Esqueleto";
import { EditorPresupuesto } from "@/componentes/presupuesto/EditorPresupuesto";

export default function VerPresupuesto() {
  return (
    <Suspense fallback={<EsqueletoPagina tarjetas={3} alto="h-16" />}>
      <EditorPresupuesto />
    </Suspense>
  );
}
