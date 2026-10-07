"use client";

import { useMemo } from "react";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Pagina } from "@/componentes/Pagina";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { BotonCompartir, ErrorHerramienta, Resultados, useCampos, useHistorial } from "@/componentes/herramientas";
import { fmt, leyDeOhm, type ResultadoOhm } from "@/dominio/calculo";

const RUTA = "/calcular/herramientas/ohm";
const BASE = { v: "", i: "", r: "", p: "" };

export default function Ohm() {
  const { campos, poner, setCampos } = useCampos(BASE);
  const { r, error } = useMemo((): { r?: ResultadoOhm; error?: string } => {
    const [v, i, res, p] = [campos.v, campos.i, campos.r, campos.p].map(aNumero);
    if ([v, i, res, p].filter((x) => x != null).length < 2) return {};
    try { return { r: leyDeOhm({ tensionV: v, corrienteA: i, resistenciaOhm: res, potenciaW: p }) }; }
    catch (e) { return { error: e instanceof Error ? e.message : "No se pudo calcular." }; }
  }, [campos]);
  useHistorial("Ley de Ohm", RUTA, campos, r ? `${fmt(r.tensionV)} V · ${fmt(r.corrienteA)} A · ${fmt(r.resistenciaOhm)} Ω · ${fmt(r.potenciaW)} W` : undefined);

  return (
    <Pagina titulo="Ley de Ohm" atras="/calcular/herramientas">
      <p className="text-sm text-slate-600">Completá exactamente dos datos; la app calcula los otros dos.</p>
      <CampoNumero etiqueta="Tensión" unidad="V" valor={campos.v} onCambio={poner("v")} />
      <CampoNumero etiqueta="Corriente" unidad="A" valor={campos.i} onCambio={poner("i")} />
      <CampoNumero etiqueta="Resistencia" unidad="Ω" valor={campos.r} onCambio={poner("r")} />
      <CampoNumero etiqueta="Potencia" unidad="W" valor={campos.p} onCambio={poner("p")} />
      <button type="button" onClick={() => setCampos(BASE)} className="min-h-11 text-sm text-slate-600 underline">Limpiar</button>
      {error && <ErrorHerramienta mensaje={error} />}
      {r && (
        <>
          <Resultados filas={[{ etiqueta: "Tensión", valor: `${fmt(r.tensionV)} V` }, { etiqueta: "Corriente", valor: `${fmt(r.corrienteA)} A` }, { etiqueta: "Resistencia", valor: `${fmt(r.resistenciaOhm)} Ω` }, { etiqueta: "Potencia", valor: `${fmt(r.potenciaW)} W` }]} />
          <PasoAPaso pasos={r.pasos} />
          <BotonCompartir ruta={RUTA} campos={campos} />
        </>
      )}
    </Pagina>
  );
}
