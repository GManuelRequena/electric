"use client";

import { useMemo } from "react";
import { AvisoNoVerificado } from "@/componentes/AvisoNoVerificado";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Pagina } from "@/componentes/Pagina";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { BotonCompartir, ErrorHerramienta, Resultados, useCampos, useHistorial } from "@/componentes/herramientas";
import { dimensionadoFotovoltaico, fmt, type ResultadoFotovoltaico } from "@/dominio/calculo";

const RUTA = "/calcular/herramientas/fotovoltaico";
const BASE = { consumo: "", hsp: "", panel: "", rend: "0,75", dias: "2", vb: "24", dod: "0,5" };

export default function Fotovoltaico() {
  const { campos, poner } = useCampos(BASE);
  const { r, error } = useMemo((): { r?: ResultadoFotovoltaico; error?: string } => {
    const [c, h, p, re, d, v, dod] = [campos.consumo, campos.hsp, campos.panel, campos.rend, campos.dias, campos.vb, campos.dod].map(aNumero);
    if ([c, h, p, re, d, v, dod].some((x) => x == null)) return {};
    try { return { r: dimensionadoFotovoltaico({ consumoDiarioWh: c!, horasSolPico: h!, potenciaPanelWp: p!, rendimiento: re!, diasAutonomia: d!, tensionBancoV: v!, profundidadDescarga: dod! }) }; }
    catch (e) { return { error: e instanceof Error ? e.message : "No se pudo calcular." }; }
  }, [campos]);
  useHistorial("Fotovoltaico", RUTA, campos, r ? `${r.panelesNecesarios} paneles · ${fmt(r.capacidadBancoAh)} Ah` : undefined);

  return (
    <Pagina titulo="Fotovoltaico básico" atras="/calcular/herramientas">
      <AvisoNoVerificado>Dimensionado orientativo con datos tuyos o del fabricante. No verifica reglamentación de instalaciones fotovoltaicas.</AvisoNoVerificado>
      <CampoNumero etiqueta="Consumo diario" unidad="Wh" valor={campos.consumo} onCambio={poner("consumo")} />
      <CampoNumero etiqueta="Horas sol pico (HSP)" unidad="h" valor={campos.hsp} onCambio={poner("hsp")} ayuda="Del lugar y de la época más desfavorable." />
      <CampoNumero etiqueta="Potencia de cada panel" unidad="Wp" valor={campos.panel} onCambio={poner("panel")} />
      <CampoNumero etiqueta="Rendimiento del sistema" valor={campos.rend} onCambio={poner("rend")} ayuda="Entre 0 y 1: pérdidas de cables, regulador, temperatura y suciedad." />
      <CampoNumero etiqueta="Días de autonomía" valor={campos.dias} onCambio={poner("dias")} />
      <CampoNumero etiqueta="Tensión del banco" unidad="V" valor={campos.vb} onCambio={poner("vb")} />
      <CampoNumero etiqueta="Profundidad de descarga" valor={campos.dod} onCambio={poner("dod")} ayuda="Entre 0 y 1; depende del tipo de batería (dato del fabricante)." />
      {error && <ErrorHerramienta mensaje={error} />}
      {r && (
        <>
          <Resultados filas={[{ etiqueta: "Paneles", valor: String(r.panelesNecesarios) }, { etiqueta: "Generador instalado", valor: `${fmt(r.potenciaGeneradorWp)} Wp` }, { etiqueta: "Banco", valor: `${fmt(r.capacidadBancoAh)} Ah` }, { etiqueta: "Energía del banco", valor: `${fmt(r.capacidadBancoWh)} Wh` }]} />
          <PasoAPaso pasos={r.pasos} />
          <BotonCompartir ruta={RUTA} campos={campos} />
        </>
      )}
    </Pagina>
  );
}
