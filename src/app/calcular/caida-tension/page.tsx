"use client";

import { useMemo, useState } from "react";
import { AvisoNoVerificado } from "@/componentes/AvisoNoVerificado";
import { Boton } from "@/componentes/Boton";
import { BotonConsultar } from "@/componentes/BotonConsultar";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Cita } from "@/componentes/Cita";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { Pagina } from "@/componentes/Pagina";
import { Segmentado, Selector } from "@/componentes/Selector";
import { PuntoSemaforo, semaforoCaida } from "@/componentes/TarjetaResultado";
import { METODO_POR_DEFECTO } from "@/componentes/opciones";
import {
  aea770,
  caidaTension,
  corrienteDesdePotencia,
  elegirTermica,
  fmt,
  largoMaximo,
  resistividadDe,
  seccionesConIz,
  tablaCaidaPorSeccion,
  tensionEnExtremo,
  type Paso,
} from "@/dominio/calculo";
import { AJUSTES_POR_DEFECTO, useAlmacen } from "@/integraciones/persistencia/almacen";

type Modo = "verificar" | "seccion" | "largo";
interface Tramo { id: number; largo: string; seccion: string }

export default function CaidaTension() {
  const [ajustes] = useAlmacen("ajustes", AJUSTES_POR_DEFECTO);
  const [modo, setModo] = useState<Modo>("verificar");
  const [sistema, setSistema] = useState<"monofasico" | "trifasico">("monofasico");
  const [tension, setTension] = useState("");
  const [tensionOrigen, setTensionOrigen] = useState("");
  const [dato, setDato] = useState<"A" | "W">("A");
  const [valor, setValor] = useState("");
  const [cos, setCos] = useState("1");
  const [largo, setLargo] = useState("");
  const [material, setMaterial] = useState<"cobre" | "aluminio">(ajustes.material);
  const [seccion, setSeccion] = useState("");
  const [casoIdx, setCasoIdx] = useState(0);
  const [limiteTxt, setLimiteTxt] = useState("");
  const [tramos, setTramos] = useState<Tramo[]>([]);

  const casos = aea770.caidaTension.filas;
  const caso = casos[casoIdx] ?? casos[0];
  const limite = aNumero(limiteTxt) ?? caso.maxPorcentaje;
  const tensionV = aNumero(tension) ?? (sistema === "trifasico" ? ajustes.tensionTriV : ajustes.tensionMonoV);

  const calc = useMemo(() => {
    const v = aNumero(valor);
    const c = aNumero(cos) ?? 1;
    if (v == null || v <= 0 || !(c > 0 && c <= 1)) return null;
    const corrienteA = dato === "A" ? v : corrienteDesdePotencia(v, tensionV, c, sistema);
    const rho = resistividadDe(material);
    const l = aNumero(largo);
    const base = { corrienteA, resistividadOhmMm2PorM: rho.resistividadOhmMm2PorM, sistema, cosPhi: c, tensionV };
    const secciones = seccionesConIz(METODO_POR_DEFECTO, material).map((f) => f.seccionMm2);
    return { corrienteA, rho, l, base, secciones, c };
  }, [valor, cos, dato, tensionV, material, sistema, largo]);

  const pasos: Paso[] = [];
  let contenido: React.ReactNode = null;
  const k = sistema === "trifasico" ? "√3" : "2";
  const formula = `ΔU = ${k} · L · I · (ρ / S) · cos φ`;
  const citaFormula = { norma: "Curso Electricista Instalador", edicion: "s/d", referencia: "Módulo 4, verificación de la caída de tensión (ΔU = I · R, R = ρ · 2L / S)", documento: "MODULO_4_EI.pdf", pagina: 342 };

  if (calc) {
    pasos.push({ titulo: "Corriente", detalle: `${fmt(calc.corrienteA)} A${dato === "W" ? ` (de ${valor} W a ${fmt(tensionV, 0)} V)` : ""}.` });
    pasos.push({ titulo: "Resistividad", detalle: `ρ ${material} = ${calc.rho.resistividadOhmMm2PorM} Ω·mm²/m.`, fuente: calc.rho.fuente, advertencia: calc.rho.verificado ? undefined : "Valor sin verificar (resistividad del curso a 15 °C)." });
    pasos.push({ titulo: "Límite de caída", detalle: `${fmt(limite)} % (${caso.caso}).`, fuente: caso.fuente, advertencia: limite !== caso.maxPorcentaje ? `Límite editado a mano: la norma indica ${fmt(caso.maxPorcentaje)} %.` : caso.verificado ? undefined : "Valor sin verificar (límites de caída)." });

    const sec = aNumero(seccion);
    if (modo === "verificar" && calc.l != null && sec != null && sec > 0) {
      const r = caidaTension({ ...calc.base, largoM: calc.l, seccionMm2: sec });
      pasos.push({ titulo: "Caída de tensión", formula, detalle: `${k} · ${fmt(calc.l)} · ${fmt(calc.corrienteA)} · (${calc.rho.resistividadOhmMm2PorM} / ${fmt(sec)}) · ${fmt(calc.c)} = ${fmt(r.volts)} V → ${fmt(r.pct)} % de ${fmt(tensionV, 0)} V.`, fuente: citaFormula });
      const origen = aNumero(tensionOrigen);
      if (origen) pasos.push({ titulo: "Tensión estimada en el extremo", detalle: `${fmt(origen)} V − ${fmt(r.volts)} V = ${fmt(tensionEnExtremo(origen, r.volts))} V. El límite se verifica en % sobre la tensión nominal (${fmt(tensionV, 0)} V).` });
      const estado = semaforoCaida(r.pct, limite);
      contenido = (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4" data-testid="resultado-caida">
          <p className="flex items-center gap-2 text-lg font-bold"><PuntoSemaforo estado={estado} /> {fmt(r.volts)} V · {fmt(r.pct)} %</p>
          <p className="text-sm">{r.pct <= limite ? `Cumple el límite de ${fmt(limite)} %.` : `No cumple el límite de ${fmt(limite)} %.`}</p>
          {origen != null && origen > 0 && <p className="text-sm">Tensión en el extremo: {fmt(tensionEnExtremo(origen, r.volts))} V</p>}
        </div>
      );
    } else if (modo === "seccion" && calc.l != null) {
      const tabla = tablaCaidaPorSeccion({ ...calc.base, largoM: calc.l }, calc.secciones, limite);
      const primera = tabla.find((f) => f.cumple);
      let nota = "";
      if (primera) {
        const iz = seccionesConIz(METODO_POR_DEFECTO, material).find((f) => f.seccionMm2 === primera.seccionMm2)!;
        const t = elegirTermica(calc.corrienteA, iz.corrienteAdmisibleA);
        nota = "error" in t ? `Ojo: con ${fmt(primera.seccionMm2)} mm² no se cumple Ib ≤ In ≤ Iz (${t.error})` : `Térmica asociada: ${t.inA} A (Iz = ${fmt(iz.corrienteAdmisibleA)} A).`;
      }
      pasos.push({ titulo: "Sección mínima por caída", formula, detalle: primera ? `La menor sección que cumple ${fmt(limite)} % es ${fmt(primera.seccionMm2)} mm² (${fmt(primera.pct)} %). ${nota}` : "Ninguna sección cargada cumple.", fuente: citaFormula });
      contenido = (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-white p-4" data-testid="resultado-caida">
          <p className="text-lg font-bold">{primera ? `Sección mínima: ${fmt(primera.seccionMm2)} mm²` : "Ninguna sección cumple"}</p>
          {primera && <p className="text-sm">Caída {fmt(primera.volts)} V = {fmt(primera.pct)} %. {nota}</p>}
          <p className="text-xs text-slate-500">Además hay que cumplir la sección mínima del tipo de circuito y Iz ≥ In.</p>
        </div>
      );
    } else if (modo === "largo" && sec != null && sec > 0) {
      const lm = largoMaximo({ ...calc.base, seccionMm2: sec }, limite);
      pasos.push({ titulo: "Largo máximo", formula: `L = (límite · U / 100) · S / (${k} · I · ρ · cos φ)`, detalle: `Con ${fmt(sec)} mm² y ${fmt(limite)} %: ${fmt(lm, 1)} m.`, fuente: citaFormula });
      contenido = (
        <div className="rounded-xl border-2 border-slate-200 bg-white p-4" data-testid="resultado-caida">
          <p className="text-lg font-bold">Largo máximo: {fmt(lm, 1)} m</p>
          <p className="text-sm">Con {fmt(sec)} mm², {fmt(calc.corrienteA)} A y límite de {fmt(limite)} %.</p>
        </div>
      );
    }
  }

  const tabla = calc && calc.l != null ? tablaCaidaPorSeccion({ ...calc.base, largoM: calc.l }, calc.secciones, limite) : [];
  const primeraOk = tabla.find((f) => f.cumple)?.seccionMm2;

  const acumulado = useMemo(() => {
    if (!calc) return null;
    let volts = 0;
    for (const t of tramos) {
      const l = aNumero(t.largo);
      const s = aNumero(t.seccion);
      if (l && s) volts += caidaTension({ ...calc.base, largoM: l, seccionMm2: s }).volts;
    }
    return { volts, pct: (volts / tensionV) * 100 };
  }, [calc, tramos, tensionV]);

  return (
    <Pagina titulo="Caída de tensión" atras="/calcular">
      <Segmentado etiqueta="Modo" valor={modo} opciones={[{ valor: "verificar", texto: "Verificar" }, { valor: "seccion", texto: "Sección" }, { valor: "largo", texto: "Largo máx." }]} onCambio={setModo} />
      <div className="flex flex-col gap-3">
        <Segmentado etiqueta="Sistema" valor={sistema} opciones={[{ valor: "monofasico", texto: "Monofásico" }, { valor: "trifasico", texto: "Trifásico" }]} onCambio={setSistema} />
        <Segmentado etiqueta="Dato de la carga" valor={dato} opciones={[{ valor: "A", texto: "Corriente (A)" }, { valor: "W", texto: "Potencia (W)" }]} onCambio={(d) => { setDato(d); setValor(""); }} />
        <CampoNumero etiqueta={dato === "A" ? "Corriente" : "Potencia"} unidad={dato} valor={valor} onCambio={setValor} />
        {dato === "W" && <CampoNumero etiqueta="cos φ" valor={cos} onCambio={setCos} />}
        {dato === "A" && <CampoNumero etiqueta="cos φ" valor={cos} onCambio={setCos} ayuda="1 para cargas resistivas." />}
        {modo !== "largo" && <CampoNumero etiqueta="Largo del tramo (ida)" unidad="m" valor={largo} onCambio={setLargo} />}
        {modo !== "seccion" && <CampoNumero etiqueta="Sección" unidad="mm²" valor={seccion} onCambio={setSeccion} />}
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Tensión, material y límite</summary>
          <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
            <CampoNumero etiqueta="Tensión nominal" unidad="V" valor={tension} placeholder={String(sistema === "trifasico" ? ajustes.tensionTriV : ajustes.tensionMonoV)} onCambio={setTension} />
            <CampoNumero etiqueta="Tensión medida en el origen (opcional)" unidad="V" valor={tensionOrigen} onCambio={setTensionOrigen} ayuda="Estima la tensión real en el extremo; el límite sigue siendo sobre la nominal." />
            <Segmentado etiqueta="Material" valor={material} opciones={[{ valor: "cobre", texto: "Cobre" }, { valor: "aluminio", texto: "Aluminio" }]} onCambio={setMaterial} />
            <Selector etiqueta="Tipo de tramo / carga" valor={String(casoIdx)} opciones={casos.map((c, i) => ({ valor: String(i), texto: `${c.caso} (${c.maxPorcentaje} %)` }))} onCambio={(v) => { setCasoIdx(Number(v)); setLimiteTxt(""); }} />
            <CampoNumero etiqueta="Límite de caída" unidad="%" valor={limiteTxt} placeholder={String(caso.maxPorcentaje)} onCambio={setLimiteTxt} />
            {limiteTxt !== "" && limite !== caso.maxPorcentaje && <AvisoNoVerificado>Estás usando un límite distinto del de la norma ({fmt(caso.maxPorcentaje)} %).</AvisoNoVerificado>}
          </div>
        </details>
      </div>

      {contenido}
      {calc && !caso.verificado && <Cita fuente={caso.fuente} />}
      {pasos.length > 0 && <PasoAPaso pasos={pasos} />}

      {tabla.length > 0 && (
        <section aria-label="Tabla comparativa" className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Todas las secciones</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs text-slate-600">
                <tr><th className="px-3 py-2">Sección</th><th className="px-3 py-2">Caída</th><th className="px-3 py-2">%</th><th className="px-3 py-2"> </th></tr>
              </thead>
              <tbody>
                {tabla.map((f) => (
                  <tr key={f.seccionMm2} className={f.seccionMm2 === primeraOk ? "bg-emerald-50 font-semibold" : ""}>
                    <td className="px-3 py-2">{fmt(f.seccionMm2)} mm²</td>
                    <td className="px-3 py-2">{fmt(f.volts)} V</td>
                    <td className="px-3 py-2">{fmt(f.pct)} %</td>
                    <td className="px-3 py-2"><PuntoSemaforo estado={semaforoCaida(f.pct, limite)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {calc && (
        <details className="rounded-xl border border-slate-200 bg-white">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Varios tramos (principal + seccional + terminal)</summary>
          <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
            {tramos.map((t, i) => (
              <div key={t.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <CampoNumero etiqueta={`Tramo ${i + 1}: largo`} unidad="m" valor={t.largo} onCambio={(v) => setTramos((x) => x.map((y) => (y.id === t.id ? { ...y, largo: v } : y)))} />
                <CampoNumero etiqueta="Sección" unidad="mm²" valor={t.seccion} onCambio={(v) => setTramos((x) => x.map((y) => (y.id === t.id ? { ...y, seccion: v } : y)))} />
                <button type="button" aria-label={`Quitar tramo ${i + 1}`} className="size-12 text-xl text-red-600" onClick={() => setTramos((x) => x.filter((y) => y.id !== t.id))}>×</button>
              </div>
            ))}
            <Boton variante="secundario" onClick={() => setTramos((x) => [...x, { id: Date.now() + x.length, largo: "", seccion: "" }])}>+ Agregar tramo</Boton>
            {tramos.length > 0 && acumulado && (
              <p className="flex items-center gap-2 text-sm font-medium">
                <PuntoSemaforo estado={semaforoCaida(acumulado.pct, limite)} />
                Caída acumulada: {fmt(acumulado.volts)} V = {fmt(acumulado.pct)} % (límite {fmt(limite)} %)
              </p>
            )}
            <p className="text-xs text-slate-500">PENDIENTE_VERIFICAR: la Guía no desglosa el límite por tramo; se compara el total con el límite elegido.</p>
          </div>
        </details>
      )}

      {calc && contenido && <BotonConsultar pregunta="¿Cómo verifico la caída de tensión de este circuito según la AEA 90364?" contexto={`Corriente ${fmt(calc.corrienteA)} A, ${sistema}, ${material}, límite ${fmt(limite)} %.`} />}
    </Pagina>
  );
}
