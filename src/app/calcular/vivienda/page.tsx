"use client";

import { useMemo, useState } from "react";
import { AvisoNoVerificado } from "@/componentes/AvisoNoVerificado";
import { Boton } from "@/componentes/Boton";
import { BotonConsultar } from "@/componentes/BotonConsultar";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { PasoAPaso } from "@/componentes/PasoAPaso";
import { Pagina } from "@/componentes/Pagina";
import { Selector } from "@/componentes/Selector";
import { aea770, calcularVivienda, fmt } from "@/dominio/calculo";

interface Amb { id: number; tipo: string; cantidad: string; superficie: string; largo: string }

const TIPOS = [
  { valor: "estar-comedor", texto: "Estar / comedor" },
  { valor: "pasillo", texto: "Pasillo" },
  { valor: "vestibulo", texto: "Vestíbulo" },
  { valor: "bano", texto: "Baño" },
  { valor: "cocina", texto: "Cocina" },
  { valor: "dormitorio", texto: "Dormitorio (sin reglas cargadas)" },
  { valor: "lavadero", texto: "Lavadero (sin reglas cargadas)" },
];

export default function Vivienda() {
  const [sup, setSup] = useState("");
  const [semi, setSemi] = useState("");
  const [ambs, setAmbs] = useState<Amb[]>([]);

  const r = useMemo(() => {
    const s = aNumero(sup);
    if (!s || s <= 0) return null;
    return calcularVivienda({
      superficieM2: s,
      superficieSemicubiertaM2: aNumero(semi),
      ambientes: ambs.map((a) => ({ tipo: a.tipo, cantidad: Math.max(1, Math.round(aNumero(a.cantidad) ?? 1)), superficieM2: aNumero(a.superficie), largoM: aNumero(a.largo) })),
    });
  }, [sup, semi, ambs]);

  const grado = r ? aea770.gradosElectrificacion.filas.find((g) => g.grado === r.grado) : undefined;

  return (
    <Pagina titulo="Vivienda" atras="/calcular">
      <CampoNumero etiqueta="Superficie cubierta" unidad="m²" valor={sup} onCambio={setSup} />
      <CampoNumero etiqueta="Superficie semicubierta (opcional)" unidad="m²" valor={semi} onCambio={setSemi} ayuda="Cuenta al 50 %." />

      <section aria-label="Ambientes" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Ambientes</h2>
        {ambs.map((a, i) => (
          <article key={a.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1"><Selector etiqueta={`Ambiente ${i + 1}`} valor={a.tipo} opciones={TIPOS} onCambio={(v) => setAmbs((x) => x.map((y) => (y.id === a.id ? { ...y, tipo: v } : y)))} /></div>
              <button type="button" aria-label={`Quitar ambiente ${i + 1}`} className="size-12 text-xl text-red-600" onClick={() => setAmbs((x) => x.filter((y) => y.id !== a.id))}>×</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <CampoNumero etiqueta="Cantidad" valor={a.cantidad} onCambio={(v) => setAmbs((x) => x.map((y) => (y.id === a.id ? { ...y, cantidad: v } : y)))} />
              <CampoNumero etiqueta="Sup." unidad="m²" valor={a.superficie} onCambio={(v) => setAmbs((x) => x.map((y) => (y.id === a.id ? { ...y, superficie: v } : y)))} />
              <CampoNumero etiqueta="Largo" unidad="m" valor={a.largo} onCambio={(v) => setAmbs((x) => x.map((y) => (y.id === a.id ? { ...y, largo: v } : y)))} />
            </div>
          </article>
        ))}
        <Boton variante="secundario" onClick={() => setAmbs((x) => [...x, { id: Date.now() + x.length, tipo: "estar-comedor", cantidad: "1", superficie: "", largo: "" }])}>
          + Agregar ambiente
        </Boton>
      </section>

      {r && (
        <>
          <div className="rounded-xl border-2 border-emerald-500 bg-white p-4" data-testid="resultado-vivienda">
            <p className="text-lg font-bold">Grado {r.grado.toUpperCase()}</p>
            <p className="text-sm">Superficie límite Sla = {fmt(r.superficieLimiteM2)} m²{grado?.circuitosMinimos != null ? ` · ${grado.circuitosMinimos} circuitos mínimos` : ""}</p>
          </div>
          {r.bocasPorAmbiente.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs text-slate-600">
                  <tr><th className="px-3 py-2">Ambiente</th><th className="px-3 py-2">IUG</th><th className="px-3 py-2">TUG</th><th className="px-3 py-2">TUE</th></tr>
                </thead>
                <tbody>
                  {r.bocasPorAmbiente.map((b, i) => (
                    <tr key={i}><td className="px-3 py-2">{TIPOS.find((t) => t.valor === b.tipo)?.texto ?? b.tipo}</td><td className="px-3 py-2">{b.iluminacion}</td><td className="px-3 py-2">{b.tomas}</td><td className="px-3 py-2">{b.especiales}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ul aria-label="Advertencias" className="flex flex-col gap-2">
            {r.advertencias.map((a) => (<li key={a}><AvisoNoVerificado>{a}</AvisoNoVerificado></li>))}
          </ul>
          <PasoAPaso pasos={r.pasos} />
          <BotonConsultar pregunta="¿Qué grado de electrificación y cuántos circuitos mínimos corresponden a esta vivienda?" contexto={`Superficie cubierta ${sup} m², semicubierta ${semi || 0} m². Grado calculado: ${r.grado}.`} />
        </>
      )}
    </Pagina>
  );
}
