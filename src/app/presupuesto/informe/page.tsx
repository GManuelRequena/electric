import { Suspense } from "react";
import { EsqueletoPagina } from "@/componentes/Esqueleto";
import { VistaInforme } from "@/componentes/presupuesto/VistaInforme";

export default function Informe() {
  return (
    <Suspense fallback={<EsqueletoPagina tarjetas={3} alto="h-16" />}>
      <VistaInforme />
    </Suspense>
  );
}
