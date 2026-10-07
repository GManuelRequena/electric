"use client";

import { useMemo } from "react";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Pagina } from "@/componentes/Pagina";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { Segmentado } from "@/componentes/Selector";
import { BotonCompartir, ErrorHerramienta, Resultados, useCampos, useHistorial } from "@/componentes/herramientas";
import { fmt, potenciaCa, type ResultadoPotenciaCa } from "@/dominio/calculo";

const RUTA = "/calcular/herramientas/potencia";
const BASE = { sistema: "monofasico", dato: "A", valor: "", tension: "", cos: "1" };

export default function Potencia() {
  const { campos, poner } = useCampos(BASE);
  const sistema = campos.sistema === "trifasico" ? "trifasico" : "monofasico";
  const dato = campos.dato === "W" ? "W" : "A";
  const { r, error } = useMemo((): { r?: ResultadoPotenciaCa; error?: string } => {
    const v = aNumero(campos.valor);
    const tension = aNumero(campos.tension) ?? (sistema === "trifasico" ? 380 : 220);
    if (v == null) return {};
    try { return { r: potenciaCa({ sistema, tensionV: tension, cosPhi: aNumero(campos.cos) ?? 1, corrienteA: dato === "A" ? v : undefined, potenciaW: dato === "W" ? v : undefined }) }; }
    catch (e) { return { error: e instanceof Error ? e.message : "No se pudo calcular." }; }
  }, [campos, sistema, dato]);
  useHistorial("Potencia en CA", RUTA, campos, r ? `${fmt(r.potenciaActivaW)} W · ${fmt(r.corrienteA)} A (${sistema})` : undefined);

  return (
    <Pagina titulo="Potencia en CA" atras="/calcular/herramientas">
      <Segmentado etiqueta="Sistema" valor={sistema} opciones={[{ valor: "monofasico", texto: "Monofásico" }, { valor: "trifasico", texto: "Trifásico" }]} onCambio={poner("sistema")} />
      <Segmentado etiqueta="Dato de la carga" valor={dato} opciones={[{ valor: "A", texto: "Corriente (A)" }, { valor: "W", texto: "Potencia (W)" }]} onCambio={poner("dato")} />
      <CampoNumero etiqueta={dato === "A" ? "Corriente" : "Potencia activa"} unidad={dato} valor={campos.valor} onCambio={poner("valor")} />
      <CampoNumero etiqueta="Tensión" unidad="V" valor={campos.tension} placeholder={sistema === "trifasico" ? "380" : "220"} onCambio={poner("tension")} ayuda={sistema === "trifasico" ? "Entre fases." : "Fase-neutro."} />
      <CampoNumero etiqueta="cos φ" valor={campos.cos} onCambio={poner("cos")} ayuda="1 para cargas resistivas." />
      {error && <ErrorHerramienta mensaje={error} />}
      {r && (
        <>
          <Resultados filas={[{ etiqueta: "Corriente", valor: `${fmt(r.corrienteA)} A` }, { etiqueta: "Activa P", valor: `${fmt(r.potenciaActivaW)} W` }, { etiqueta: "Aparente S", valor: `${fmt(r.potenciaAparenteVA)} VA` }, { etiqueta: "Reactiva Q", valor: `${fmt(r.potenciaReactivaVAr)} VAr` }]} />
          <PasoAPaso pasos={r.pasos} />
          <BotonCompartir ruta={RUTA} campos={campos} />
        </>
      )}
    </Pagina>
  );
}
