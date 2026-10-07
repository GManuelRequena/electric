"use client";

import Link from "next/link";
import { useState } from "react";
import { aplicarTema } from "@/componentes/AplicarTema";
import { Boton } from "@/componentes/Boton";
import { ContadorUso } from "@/componentes/ContadorUso";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { Pagina } from "@/componentes/Pagina";
import { Segmentado } from "@/componentes/Selector";
import { AJUSTES_POR_DEFECTO, borrarTodo, useAlmacen } from "@/integraciones/persistencia/almacen";

export default function Ajustes() {
  const [a, setA, listo] = useAlmacen("ajustes", AJUSTES_POR_DEFECTO);
  const [borrado, setBorrado] = useState(false);
  const num = (v: string, campo: "tensionMonoV" | "tensionTriV" | "reservaPct" | "capacidadCorteKa") => {
    const n = aNumero(v);
    if (n != null && n >= 0) setA((p) => ({ ...p, [campo]: n }));
  };
  if (!listo) return <Pagina titulo="Ajustes" atras="/calcular">{null}</Pagina>;
  return (
    <Pagina titulo="Ajustes" atras="/calcular">
      <Segmentado etiqueta="Tema" valor={a.tema} opciones={[{ valor: "auto", texto: "Automático" }, { valor: "claro", texto: "Claro" }, { valor: "oscuro", texto: "Oscuro" }]} onCambio={(v) => { setA((p) => ({ ...p, tema: v })); aplicarTema(v); }} />
      <CampoNumero etiqueta="Tensión monofásica" unidad="V" valor={String(a.tensionMonoV)} onCambio={(v) => num(v, "tensionMonoV")} ayuda="Nominal del curso: 220 V." />
      <CampoNumero etiqueta="Tensión trifásica" unidad="V" valor={String(a.tensionTriV)} onCambio={(v) => num(v, "tensionTriV")} ayuda="Nominal del curso: 380 V." />
      <Segmentado etiqueta="Material por defecto" valor={a.material} opciones={[{ valor: "cobre", texto: "Cobre" }, { valor: "aluminio", texto: "Aluminio" }]} onCambio={(v) => setA((p) => ({ ...p, material: v }))} />
      <CampoNumero etiqueta="Reserva sobre Ib" unidad="%" valor={String(a.reservaPct)} onCambio={(v) => num(v, "reservaPct")} ayuda="0 = sin reserva. Criterio propio, no de la AEA." />
      <CampoNumero etiqueta="Capacidad de corte de la térmica" unidad="kA" valor={String(a.capacidadCorteKa)} onCambio={(v) => num(v, "capacidadCorteKa")} ayuda="Dato configurable, no calculado." />
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        URL de NotebookLM
        <input value={a.notebookUrl} onChange={(e) => setA((p) => ({ ...p, notebookUrl: e.target.value }))} inputMode="url" className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
        <span className="text-xs font-normal text-slate-500">Si el link no abre, probá con el dominio notebooklm.google.com.</span>
      </label>
      <ContadorUso />
      <Link href="/ajustes/perfil" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-800">Perfil del instalador</Link>
      <Link href="/ajustes/precios" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-800">Lista de precios</Link>
      <Boton variante="secundario" onClick={() => { setA(AJUSTES_POR_DEFECTO); aplicarTema(AJUSTES_POR_DEFECTO.tema); }}>Restablecer ajustes</Boton>
      <Boton variante="peligro" onClick={() => { if (window.confirm("¿Borrar todos los datos locales (ajustes, perfil, últimos cálculos y artefactos propios)?")) { borrarTodo(); setA(AJUSTES_POR_DEFECTO); aplicarTema(AJUSTES_POR_DEFECTO.tema); setBorrado(true); } }}>
        Borrar datos locales
      </Boton>
      {borrado && <p role="status" className="text-sm text-emerald-700">Datos locales borrados.</p>}
    </Pagina>
  );
}
