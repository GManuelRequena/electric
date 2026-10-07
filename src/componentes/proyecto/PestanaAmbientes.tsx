"use client";

import { useState } from "react";
import { Boton } from "@/componentes/Boton";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { HojaInferior } from "@/componentes/HojaInferior";
import { Selector } from "@/componentes/Selector";
import type { Hallazgo } from "@/dominio/circuitos/validar";
import { ES_TECLA, NOMBRES_AMBIENTE, nuevoId, type Ambiente, type Elemento, type Proyecto, type TipoAmbiente } from "@/dominio/proyecto/tipos";
import { CatalogoElementos, type NuevoElemento } from "./CatalogoElementos";
import { etiquetaElemento, ICONOS } from "./etiquetas";

interface Props {
  proyecto: Proyecto;
  hallazgos: Hallazgo[];
  abierto: string | null;
  onAbrir: (id: string | null) => void;
  cambiar: (fn: (p: Proyecto) => Proyecto) => void;
}

const positivo = (n: number | undefined) => (n != null && n > 0 ? n : undefined);
const TIPOS = (Object.keys(NOMBRES_AMBIENTE) as TipoAmbiente[]).map((t) => ({ valor: t, texto: NOMBRES_AMBIENTE[t] }));

export function PestanaAmbientes({ proyecto: p, hallazgos, abierto, onAbrir, cambiar }: Props) {
  const [nuevo, setNuevo] = useState(false);
  const [catalogo, setCatalogo] = useState<string | null>(null);

  const agregarElementos = (ambienteId: string, items: NuevoElemento[]) =>
    cambiar((x) => ({ ...x, elementos: [...x.elementos, ...items.map((i): Elemento => ({ ...i, id: nuevoId(), ambienteId }))] }));
  const quitarElemento = (id: string) =>
    cambiar((x) => ({
      ...x,
      elementos: x.elementos
        .filter((e) => e.id !== id)
        .map((e) => ({ ...e, enchufadoEn: e.enchufadoEn === id ? undefined : e.enchufadoEn, comandaA: e.comandaA?.filter((l) => l !== id) })),
    }));

  const ambienteCatalogo = p.ambientes.find((a) => a.id === catalogo);

  return (
    <div className="flex flex-col gap-3">
      {p.ambientes.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Agregá el primer ambiente (cocina, dormitorio...) y cargale los elementos.</p>}
      {p.ambientes.map((a) => {
        const els = p.elementos.filter((e) => e.ambienteId === a.id);
        const errores = hallazgos.filter((h) => h.ambienteId === a.id && h.severidad === "error").length;
        const avisos = hallazgos.filter((h) => h.ambienteId === a.id && h.severidad === "advertencia").length;
        const estaAbierto = abierto === a.id;
        const luces = els.filter((e) => e.tipo === "boca_luz");
        return (
          <article key={a.id} id={`ambiente-${a.id}`} className="rounded-xl border border-slate-200 bg-white">
            <button type="button" aria-expanded={estaAbierto} onClick={() => onAbrir(estaAbierto ? null : a.id)} className="flex min-h-14 w-full items-center justify-between gap-2 px-4 py-3 text-left">
              <span className="flex flex-col">
                <span className="text-lg font-semibold">{a.nombre}</span>
                <span className="text-sm text-slate-600">
                  {NOMBRES_AMBIENTE[a.tipo]} · {els.length} {els.length === 1 ? "elemento" : "elementos"}
                </span>
              </span>
              <span
                role="img"
                aria-label={errores ? `${errores} errores` : avisos ? `${avisos} advertencias` : "Cumple los mínimos"}
                className={`text-xl ${errores ? "text-red-600" : avisos ? "text-amber-600" : "text-emerald-600"}`}
              >
                {errores ? "⚠" : avisos ? "⚠" : "✓"}
              </span>
            </button>
            {estaAbierto && (
              <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
                {hallazgos
                  .filter((h) => h.ambienteId === a.id && h.severidad !== "info")
                  .map((h, i) => (
                    <p key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {h.mensaje}
                    </p>
                  ))}
                <ul aria-label={`Elementos de ${a.nombre}`} className="flex flex-col gap-1">
                  {els.length === 0 && <li className="text-sm text-slate-600">Sin elementos todavía.</li>}
                  {els.map((e) => (
                    <li key={e.id} className="flex min-h-12 items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 text-sm">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">
                          <span aria-hidden>{ICONOS[e.tipo]} </span>
                          {e.enchufadoEn ? "↳ " : ""}
                          {etiquetaElemento(e)}
                          {e.artefacto?.potenciaW ? ` (${e.artefacto.potenciaW} W)` : ""}
                        </span>
                        <span className="text-xs text-slate-500">
                          {ES_TECLA(e.tipo) ? `Comanda ${e.comandaA?.length ?? 0} ${(e.comandaA?.length ?? 0) === 1 ? "luz" : "luces"}` : e.circuitoId ? `Circuito ${e.circuitoId}` : "Sin circuito"}
                        </span>
                      </span>
                      <span className="flex items-center">
                        {ES_TECLA(e.tipo) && luces.length > 0 && (
                          <select
                            aria-label="Luces que comanda"
                            value=""
                            onChange={(ev) => {
                              const luz = ev.target.value;
                              if (!luz) return;
                              cambiar((x) => ({ ...x, elementos: x.elementos.map((y) => (y.id === e.id ? { ...y, comandaA: y.comandaA?.includes(luz) ? y.comandaA.filter((l) => l !== luz) : [...(y.comandaA ?? []), luz] } : y)) }));
                            }}
                            className="h-11 w-24 rounded-lg border border-slate-300 bg-white px-1 text-xs"
                          >
                            <option value="">Luces...</option>
                            {luces.map((l, i) => (
                              <option key={l.id} value={l.id}>
                                {e.comandaA?.includes(l.id) ? "✓ " : ""}Luz {i + 1}
                              </option>
                            ))}
                          </select>
                        )}
                        <button type="button" aria-label={`Quitar ${etiquetaElemento(e)}`} onClick={() => quitarElemento(e.id)} className="size-11 text-xl text-red-600">
                          ×
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                <Boton onClick={() => setCatalogo(a.id)}>+ Agregar elemento</Boton>
                <Boton
                  variante="peligro"
                  onClick={() => {
                    cambiar((x) => ({ ...x, ambientes: x.ambientes.filter((y) => y.id !== a.id), elementos: x.elementos.filter((e) => e.ambienteId !== a.id) }));
                    onAbrir(null);
                  }}
                >
                  Quitar ambiente
                </Boton>
              </div>
            )}
          </article>
        );
      })}
      <Boton variante="secundario" onClick={() => setNuevo(true)}>
        + Ambiente
      </Boton>

      {ambienteCatalogo && (
        <CatalogoElementos
          abierta
          onCerrar={() => setCatalogo(null)}
          ambienteNombre={ambienteCatalogo.nombre}
          luces={p.elementos.filter((e) => e.ambienteId === ambienteCatalogo.id && e.tipo === "boca_luz")}
          tomas={p.elementos.filter((e) => e.ambienteId === ambienteCatalogo.id && (e.tipo === "toma_general" || e.tipo === "toma_especial" || e.tipo === "toma_exterior"))}
          onAgregar={(items) => agregarElementos(ambienteCatalogo.id, items)}
        />
      )}

      <HojaInferior abierta={nuevo} titulo="Nuevo ambiente" onCerrar={() => setNuevo(false)}>
        <FormAmbiente
          proyecto={p}
          onCrear={(a) => {
            cambiar((x) => ({ ...x, ambientes: [...x.ambientes, a] }));
            setNuevo(false);
            onAbrir(a.id);
          }}
        />
      </HojaInferior>
    </div>
  );
}

function FormAmbiente({ proyecto, onCrear }: { proyecto: Proyecto; onCrear: (a: Ambiente) => void }) {
  const [tipo, setTipo] = useState<TipoAmbiente>("dormitorio");
  const [nombre, setNombre] = useState("");
  const [sup, setSup] = useState("");
  const [largo, setLargo] = useState("");
  const cuantos = proyecto.ambientes.filter((a) => a.tipo === tipo).length;
  const sugerido = `${NOMBRES_AMBIENTE[tipo]}${cuantos > 0 ? ` ${cuantos + 1}` : ""}`;
  return (
    <div className="flex flex-col gap-3">
      <Selector etiqueta="Tipo de ambiente" valor={tipo} opciones={TIPOS} onCambio={setTipo} />
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Nombre
        <input value={nombre} placeholder={sugerido} onChange={(e) => setNombre(e.target.value)} className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
      </label>
      <CampoNumero etiqueta="Superficie (opcional)" unidad="m²" valor={sup} onCambio={setSup} ayuda="La norma pide 1 boca cada cierta superficie en algunos ambientes." />
      {tipo === "pasillo" && <CampoNumero etiqueta="Largo (opcional)" unidad="m" valor={largo} onCambio={setLargo} />}
      <Boton
        onClick={() =>
          onCrear({ id: nuevoId(), nombre: nombre.trim() || sugerido, tipo, superficieM2: positivo(aNumero(sup)), largoM: tipo === "pasillo" ? positivo(aNumero(largo)) : undefined })
        }
      >
        Crear ambiente
      </Boton>
    </div>
  );
}
