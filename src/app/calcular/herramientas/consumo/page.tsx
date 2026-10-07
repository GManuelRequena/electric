"use client";

import { useMemo } from "react";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Pagina } from "@/componentes/Pagina";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { BotonCompartir, ErrorHerramienta, Resultados, useCampos, useHistorial } from "@/componentes/herramientas";
import { consumoEnergetico, fmt, type ResultadoConsumo } from "@/dominio/calculo";

const RUTA = "/calcular/herramientas/consumo";
const BASE = { potencia: "", horas: "", dias: "30", tarifa: "" };

export default function Consumo() {
  const { campos, poner } = useCampos(BASE);
  const { r, error } = useMemo((): { r?: ResultadoConsumo; error?: string } => {
    const [p, h, d, t] = [campos.potencia, campos.horas, campos.dias, campos.tarifa].map(aNumero);
    if (p == null || h == null || d == null || t == null) return {};
    try { return { r: consumoEnergetico({ potenciaW: p, horasPorDia: h, diasPorMes: d, tarifaPorKwh: t }) }; }
    catch (e) { return { error: e instanceof Error ? e.message : "No se pudo calcular." }; }
  }, [campos]);
  useHistorial("Consumo y costo", RUTA, campos, r ? `${fmt(r.kwhMes)} kWh/mes · $${fmt(r.costoMes)}` : undefined);

  return (
    <Pagina titulo="Consumo y costo" atras="/calcular/herramientas">
      <CampoNumero etiqueta="Potencia del equipo" unidad="W" valor={campos.potencia} onCambio={poner("potencia")} />
      <CampoNumero etiqueta="Horas de uso por día" unidad="h" valor={campos.horas} onCambio={poner("horas")} />
      <CampoNumero etiqueta="Días de uso por mes" valor={campos.dias} onCambio={poner("dias")} />
      <CampoNumero etiqueta="Tarifa" unidad="$/kWh" valor={campos.tarifa} onCambio={poner("tarifa")} ayuda="Tomala de tu factura; no incluye impuestos ni cargos fijos." />
      {error && <ErrorHerramienta mensaje={error} />}
      {r && (
        <>
          <Resultados filas={[{ etiqueta: "Por día", valor: `${fmt(r.kwhDia)} kWh` }, { etiqueta: "Por mes", valor: `${fmt(r.kwhMes)} kWh` }, { etiqueta: "Costo mensual", valor: `$ ${fmt(r.costoMes)}` }]} />
          <PasoAPaso pasos={r.pasos} />
          <BotonCompartir ruta={RUTA} campos={campos} />
        </>
      )}
    </Pagina>
  );
}
