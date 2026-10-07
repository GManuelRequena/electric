"use client";

import { useMemo } from "react";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Pagina } from "@/componentes/Pagina";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { BotonCompartir, ErrorHerramienta, Resultados, useCampos, useHistorial } from "@/componentes/herramientas";
import { correccionFactorPotencia, fmt, type ResultadoFactorPotencia } from "@/dominio/calculo";

const RUTA = "/calcular/herramientas/factor-potencia";
const BASE = { potencia: "", cos1: "", cos2: "0,95" };

export default function FactorPotencia() {
  const { campos, poner } = useCampos(BASE);
  const { r, error } = useMemo((): { r?: ResultadoFactorPotencia; error?: string } => {
    const [p, c1, c2] = [campos.potencia, campos.cos1, campos.cos2].map(aNumero);
    if (p == null || c1 == null || c2 == null) return {};
    try { return { r: correccionFactorPotencia({ potenciaW: p, cosActual: c1, cosObjetivo: c2 }) }; }
    catch (e) { return { error: e instanceof Error ? e.message : "No se pudo calcular." }; }
  }, [campos]);
  useHistorial("Factor de potencia", RUTA, campos, r ? `Capacitor ${fmt(r.kvar)} kVAr` : undefined);

  return (
    <Pagina titulo="Factor de potencia" atras="/calcular/herramientas">
      <CampoNumero etiqueta="Potencia activa de la carga" unidad="W" valor={campos.potencia} onCambio={poner("potencia")} />
      <CampoNumero etiqueta="cos φ actual" valor={campos.cos1} onCambio={poner("cos1")} />
      <CampoNumero etiqueta="cos φ objetivo" valor={campos.cos2} onCambio={poner("cos2")} ayuda="El valor objetivo lo fija la distribuidora o tu criterio; la app no asume uno normativo." />
      {error && <ErrorHerramienta mensaje={error} />}
      {r && (
        <>
          <Resultados filas={[{ etiqueta: "Q actual", valor: `${fmt(r.qActualKvar)} kVAr` }, { etiqueta: "Q objetivo", valor: `${fmt(r.qObjetivoKvar)} kVAr` }, { etiqueta: "Capacitor necesario", valor: `${fmt(r.kvar)} kVAr` }]} />
          <PasoAPaso pasos={r.pasos} />
          <BotonCompartir ruta={RUTA} campos={campos} />
        </>
      )}
    </Pagina>
  );
}
