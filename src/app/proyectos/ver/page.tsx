import { Suspense } from "react";
import { EsqueletoPagina } from "@/componentes/Esqueleto";
import { EditorProyecto } from "@/componentes/proyecto/EditorProyecto";

export default function VerProyecto() {
  return (
    <Suspense fallback={<EsqueletoPagina tarjetas={3} alto="h-16" />}>
      <EditorProyecto />
    </Suspense>
  );
}
