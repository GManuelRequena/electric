"use client";

import { useState } from "react";
import { Boton } from "@/componentes/Boton";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { HojaInferior } from "@/componentes/HojaInferior";
import { aea770, fmt, type Artefacto } from "@/dominio/calculo";
import { NOMBRES_ELEMENTO, nuevoId, type Elemento, type TipoElemento } from "@/dominio/proyecto/tipos";
import { etiquetaElemento, ICONOS } from "./etiquetas";

export type NuevoElemento = Omit<Elemento, "id" | "ambienteId" | "circuitoId" | "asignacionManual">;

interface Props {
  abierta: boolean;
  onCerrar: () => void;
  ambienteNombre: string;
  luces: Elemento[];
  tomas: Elemento[];
  onAgregar: (items: NuevoElemento[]) => void;
}

const SIMPLES: TipoElemento[] = ["boca_luz", "tecla_simple", "tecla_doble", "tecla_combinacion", "toma_general", "toma_especial", "toma_exterior", "artefacto"];

export function CatalogoElementos({ abierta, onCerrar, ambienteNombre, luces, tomas, onAgregar }: Props) {
  return (
    <HojaInferior abierta={abierta} titulo={`Agregar a ${ambienteNombre}`} onCerrar={onCerrar}>
      <Contenido luces={luces} tomas={tomas} onAgregar={onAgregar} onCerrar={onCerrar} />
    </HojaInferior>
  );
}

type Paso = { nombre: "grilla" } | { nombre: "luces"; tipo: TipoElemento } | { nombre: "artefacto" } | { nombre: "enchufe"; artefacto: Artefacto };

function Contenido({ luces, tomas, onAgregar, onCerrar }: Omit<Props, "abierta" | "ambienteNombre">) {
  const [paso, setPaso] = useState<Paso>({ nombre: "grilla" });
  const [cantidad, setCantidad] = useState(1);
  const [elegidas, setElegidas] = useState<string[]>(luces.length === 1 ? [luces[0].id] : []);

  const agregar = (items: NuevoElemento[]) => {
    onAgregar(items);
    onCerrar();
  };
  const veces = (item: NuevoElemento) => Array.from({ length: cantidad }, () => ({ ...item }));

  if (paso.nombre === "luces") {
    const tipo = paso.tipo;
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-700">¿Qué luces comanda {cantidad > 1 ? `cada una de las ${cantidad} ${NOMBRES_ELEMENTO[tipo].toLowerCase()}s` : `la ${NOMBRES_ELEMENTO[tipo].toLowerCase()}`}?</p>
        {luces.length === 0 && <p className="rounded-lg bg-white p-3 text-sm text-slate-600">Este ambiente todavía no tiene bocas de luz. Podés agregar la tecla y asignarle luces después.</p>}
        {luces.map((l, i) => (
          <label key={l.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
            <input type="checkbox" className="size-5" checked={elegidas.includes(l.id)} onChange={(ev) => setElegidas((x) => (ev.target.checked ? [...x, l.id] : x.filter((y) => y !== l.id)))} />
            Boca de luz {i + 1}
          </label>
        ))}
        <Boton onClick={() => agregar(veces({ tipo, comandaA: elegidas }))}>Agregar {cantidad > 1 ? `×${cantidad}` : ""}</Boton>
      </div>
    );
  }

  if (paso.nombre === "artefacto") return <ElegirArtefacto onElegir={(a) => setPaso({ nombre: "enchufe", artefacto: a })} />;

  if (paso.nombre === "enchufe") {
    return <Enchufe artefacto={paso.artefacto} tomas={tomas} onConfirmar={(enchufadoEn) => agregar(veces({ tipo: "artefacto", artefacto: { ...paso.artefacto, id: nuevoId() }, enchufadoEn }))} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2" role="group" aria-label="Cantidad a agregar">
        <span className="text-sm font-medium text-slate-700">Cantidad</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Menos" className="size-11 rounded-lg bg-white text-xl shadow-sm" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>
            −
          </button>
          <span className="w-12 text-center text-lg font-semibold" aria-live="polite">
            ×{cantidad}
          </span>
          <button type="button" aria-label="Más" className="size-11 rounded-lg bg-white text-xl shadow-sm" onClick={() => setCantidad((c) => Math.min(20, c + 1))}>
            +
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SIMPLES.map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => {
              if (tipo === "artefacto") setPaso({ nombre: "artefacto" });
              else if (tipo.startsWith("tecla")) setPaso({ nombre: "luces", tipo });
              else agregar(veces({ tipo }));
            }}
            className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-sm font-medium active:bg-slate-100"
          >
            <span aria-hidden className="text-2xl">
              {ICONOS[tipo]}
            </span>
            {NOMBRES_ELEMENTO[tipo]}
          </button>
        ))}
      </div>
    </div>
  );
}

function ElegirArtefacto({ onElegir }: { onElegir: (a: Artefacto) => void }) {
  const [q, setQ] = useState("");
  const [nombre, setNombre] = useState("");
  const [potencia, setPotencia] = useState("");
  const filas = aea770.artefactosTipicos.filas.filter((f) => f.nombre.toLowerCase().includes(q.trim().toLowerCase()));
  const w = aNumero(potencia);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Buscar artefacto
        <input value={q} onChange={(e) => setQ(e.target.value)} className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
      </label>
      <ul className="flex flex-col gap-1">
        {filas.map((f) => (
          <li key={f.nombre}>
            <button
              type="button"
              onClick={() => onElegir({ id: nuevoId(), nombre: f.nombre, potenciaW: f.potenciaW, cosPhi: f.cosFi, cantidad: 1, simultaneo: true, requiereCircuitoPropio: f.requiereCircuitoPropio, categoria: f.categoria })}
              className="flex min-h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm active:bg-slate-100"
            >
              <span>{f.nombre}</span>
              <span className="text-xs text-slate-500">{fmt(f.potenciaW, 0)} W{f.requiereCircuitoPropio ? " · propio" : ""}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-800">⚠ Las potencias del catálogo son orientativas (sin verificar): usá el dato de chapa.</p>
      <details className="rounded-xl border border-slate-200 bg-white">
        <summary className="flex min-h-12 cursor-pointer items-center px-3 text-sm font-medium">Otro artefacto</summary>
        <div className="flex flex-col gap-2 border-t border-slate-200 p-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
          </label>
          <CampoNumero etiqueta="Potencia" unidad="W" valor={potencia} onCambio={setPotencia} />
          <Boton disabled={!nombre.trim() || !w || w <= 0} onClick={() => onElegir({ id: nuevoId(), nombre: nombre.trim(), potenciaW: w, cosPhi: 1, cantidad: 1, simultaneo: true, categoria: "toma" })}>
            Usar este artefacto
          </Boton>
        </div>
      </details>
    </div>
  );
}

function Enchufe({ artefacto, tomas, onConfirmar }: { artefacto: Artefacto; tomas: Elemento[]; onConfirmar: (enchufadoEn?: string) => void }) {
  const porDefecto = artefacto.categoria === "fijo" ? "" : (tomas[0]?.id ?? "");
  const [toma, setToma] = useState(porDefecto);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-700">
        <strong>{artefacto.nombre}</strong>: ¿se enchufa o va conectado directo?
      </p>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Conexión
        <select value={toma} onChange={(e) => setToma(e.target.value)} className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal">
          <option value="">Conexión directa (circuito propio si corresponde)</option>
          {tomas.map((t) => (
            <option key={t.id} value={t.id}>
              Enchufado en {etiquetaElemento(t).toLowerCase()} {tomas.indexOf(t) + 1}
            </option>
          ))}
        </select>
      </label>
      <Boton onClick={() => onConfirmar(toma || undefined)}>Agregar artefacto</Boton>
    </div>
  );
}
