"use client";

import { useMemo, useState } from "react";
import { BotonConsultar } from "@/componentes/BotonConsultar";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { DetalleCircuito } from "@/componentes/DetalleCircuito";
import { Pagina } from "@/componentes/Pagina";
import { Segmentado, Selector } from "@/componentes/Selector";
import { TarjetaResultado } from "@/componentes/TarjetaResultado";
import { METODO_POR_DEFECTO, opcionesMetodo } from "@/componentes/opciones";
import { calcularCircuito, fmt, type CategoriaArtefacto, type ResultadoCircuito } from "@/dominio/calculo";
import { AJUSTES_POR_DEFECTO, useAlmacen } from "@/integraciones/persistencia/almacen";

export default function Rapida() {
  const [ajustes] = useAlmacen("ajustes", AJUSTES_POR_DEFECTO);
  const [sistema, setSistema] = useState<"monofasico" | "trifasico">("monofasico");
  const [dato, setDato] = useState<"W" | "A">("W");
  const [valor, setValor] = useState("");
  const [cos, setCos] = useState("1");
  const [tension, setTension] = useState("");
  const [largo, setLargo] = useState("");
  const [metodo, setMetodo] = useState(METODO_POR_DEFECTO);
  const [material, setMaterial] = useState<"cobre" | "aluminio">(ajustes.material);
  const [uso, setUso] = useState<"iluminacion" | "toma" | "propio">("toma");

  const { r, error } = useMemo((): { r?: ResultadoCircuito; error?: string } => {
    const v = aNumero(valor);
    if (v == null || v <= 0) return {};
    const c = aNumero(cos) ?? 1;
    if (!(c > 0 && c <= 1)) return { error: "El cos φ debe estar entre 0 y 1." };
    const categoria: CategoriaArtefacto = uso === "propio" ? "fijo" : uso;
    try {
      return {
        r: calcularCircuito({
          sistema,
          tensionV: aNumero(tension) ?? (sistema === "trifasico" ? ajustes.tensionTriV : ajustes.tensionMonoV),
          artefactos: [{ id: "q", nombre: "Carga", potenciaW: dato === "W" ? v : undefined, corrienteA: dato === "A" ? v : undefined, cosPhi: c, cantidad: 1, simultaneo: true, requiereCircuitoPropio: uso === "propio", categoria }],
          largoM: aNumero(largo),
          metodoInstalacion: metodo,
          material,
          reservaPct: ajustes.reservaPct || undefined,
          capacidadCorteKa: ajustes.capacidadCorteKa || undefined,
        }),
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "No se pudo calcular." };
    }
  }, [sistema, dato, valor, cos, tension, largo, metodo, material, uso, ajustes]);

  return (
    <Pagina titulo="Cálculo rápido" atras="/calcular">
      <div className="flex flex-col gap-3">
        <Segmentado etiqueta="Sistema" valor={sistema} opciones={[{ valor: "monofasico", texto: "Monofásico" }, { valor: "trifasico", texto: "Trifásico" }]} onCambio={setSistema} />
        <Segmentado etiqueta="Dato de la carga" valor={dato} opciones={[{ valor: "W", texto: "Potencia (W)" }, { valor: "A", texto: "Corriente (A)" }]} onCambio={(d) => { setDato(d); setValor(""); }} />
        <CampoNumero etiqueta={dato === "W" ? "Potencia" : "Corriente"} unidad={dato} valor={valor} onCambio={setValor} />
        <CampoNumero etiqueta="cos φ" valor={cos} onCambio={setCos} ayuda="1 para cargas resistivas." />
        <Selector etiqueta="Tipo de carga" valor={uso} opciones={[{ valor: "toma", texto: "Tomacorrientes" }, { valor: "iluminacion", texto: "Iluminación" }, { valor: "propio", texto: "Equipo con circuito propio" }]} onCambio={setUso} />
        <CampoNumero etiqueta="Largo (opcional)" unidad="m" valor={largo} onCambio={setLargo} />
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Opciones</summary>
          <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
            <CampoNumero etiqueta="Tensión" unidad="V" valor={tension} placeholder={String(sistema === "trifasico" ? ajustes.tensionTriV : ajustes.tensionMonoV)} onCambio={setTension} />
            <Selector etiqueta="Método de instalación" valor={metodo} opciones={opcionesMetodo()} onCambio={setMetodo} />
            <Segmentado etiqueta="Material" valor={material} opciones={[{ valor: "cobre", texto: "Cobre" }, { valor: "aluminio", texto: "Aluminio" }]} onCambio={setMaterial} />
          </div>
        </details>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {r && (
        <>
          <DetalleCircuito r={r} />
          <BotonConsultar pregunta="¿Está bien este circuito según la AEA 90364?" contexto={`Carga de ${valor} ${dato}, ${sistema}. Cable ${fmt(r.seccionMm2)} mm², térmica ${r.termicaA} A curva ${r.curva}.`} />
          <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-2xl px-4 pb-2">
            <TarjetaResultado r={r} />
          </div>
        </>
      )}
    </Pagina>
  );
}
