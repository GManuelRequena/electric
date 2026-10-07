"use client";

import { useState } from "react";
import type { NodoUnifilar } from "@/dominio/proyecto/unifilar";

const ANCHO = 360;
const ALTO_CIRCUITO = 72;
const Y0 = 190;

function Caja({ x, y, w, h, nodo }: { x: number; y: number; w: number; h: number; nodo: NodoUnifilar }) {
  const color = nodo.estado === "revisar" ? "#d97706" : nodo.estado === "ok" ? "#059669" : "#334155";
  const marca = nodo.estado === "ok" ? " ✓" : nodo.estado === "revisar" ? " ⚠" : "";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="white" stroke={color} strokeWidth={2} />
      <text x={x + 10} y={y + 20} fontSize={13} fontWeight={700} fill="#0f172a">
        {nodo.etiqueta}
        {marca}
      </text>
      {nodo.detalle.map((linea, i) => (
        <text key={i} x={x + 10} y={y + 38 + i * 15} fontSize={11} fill="#475569">
          {linea}
        </text>
      ))}
    </g>
  );
}

/** Interruptor termomagnético: hoja de contacto abierta con la cruz de los interruptores automáticos (tipo IRAM 2010 / IEC 60617). */
function Termomagnetica({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#334155" strokeWidth={2} fill="none">
      <circle cx={x - 8} cy={y} r={2} fill="#334155" />
      <line x1={x - 8} y1={y} x2={x + 6} y2={y - 12} />
      <line x1={x + 3} y1={y - 15} x2={x + 9} y2={y - 9} />
      <line x1={x + 9} y1={y - 15} x2={x + 3} y2={y - 9} />
    </g>
  );
}

/** Interruptor diferencial: contacto con el toroide del transformador de corriente (tipo IRAM 2010 / IEC 60617). */
function Diferencial({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#334155" strokeWidth={2} fill="white">
      <circle cx={x} cy={y} r={7} />
      <text x={x + 12} y={y + 4} fontSize={10} fill="#475569" stroke="none">
        ID
      </text>
    </g>
  );
}

/** Unifilar vertical: acometida → tablero → un ramal por circuito. Se mueve con el dedo y se agranda con los botones. */
export function Unifilar({ raiz }: { raiz: NodoUnifilar }) {
  const [zoom, setZoom] = useState(1);
  const tablero = raiz.hijos[0];
  const circuitos = tablero?.hijos ?? [];
  const alto = Y0 + Math.max(1, circuitos.length) * ALTO_CIRCUITO + 10;
  const yBarra = Y0 - 10;
  const yUltimo = Y0 + (circuitos.length - 1) * ALTO_CIRCUITO + 30;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2" role="group" aria-label="Zoom del unifilar">
        <button type="button" aria-label="Alejar" className="size-11 rounded-lg bg-white text-xl shadow-sm" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}>
          −
        </button>
        <span className="w-14 text-center text-sm">{Math.round(zoom * 100)} %</span>
        <button type="button" aria-label="Acercar" className="size-11 rounded-lg bg-white text-xl shadow-sm" onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}>
          +
        </button>
        <button type="button" className="min-h-11 rounded-lg bg-white px-3 text-sm shadow-sm" onClick={() => setZoom(1)}>
          Ajustar
        </button>
      </div>
      <div className="max-h-[70dvh] overflow-auto rounded-xl border border-slate-200 bg-white fondo-claro" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
        <svg role="img" aria-label="Diagrama unifilar" viewBox={`0 0 ${ANCHO} ${alto}`} width={ANCHO * zoom} height={alto * zoom} className="block">
          <Caja x={20} y={10} w={320} h={36} nodo={raiz} />
          <line x1={40} y1={46} x2={40} y2={72} stroke="#334155" strokeWidth={2} />
          {tablero && <Caja x={20} y={72} w={320} h={86} nodo={tablero} />}
          {circuitos.length > 0 && <line x1={40} y1={158} x2={40} y2={yUltimo} stroke="#334155" strokeWidth={2} />}
          {tablero?.detalle.some((d) => d.startsWith("Diferencial")) && <Diferencial x={40} y={168} />}
          {circuitos.map((c, i) => {
            const y = Y0 + i * ALTO_CIRCUITO;
            return (
              <g key={c.clave}>
                <line x1={40} y1={y + 30} x2={80} y2={y + 30} stroke="#334155" strokeWidth={2} />
                <Termomagnetica x={56} y={y + 30} />
                <Caja x={80} y={y} w={260} h={ALTO_CIRCUITO - 10} nodo={{ ...c, detalle: [c.detalle.slice(0, 2).join(" · "), c.detalle.slice(2).join(" · ")].filter(Boolean) }} />
              </g>
            );
          })}
          {circuitos.length === 0 && (
            <text x={20} y={yBarra + 20} fontSize={12} fill="#64748b">
              Todavía no hay circuitos: agregá elementos en los ambientes.
            </text>
          )}
        </svg>
      </div>
      <p className="text-xs text-slate-500">Símbolos tipo IRAM 2010 / IEC 60617 dibujados a mano, sin verificar contra la norma IRAM 2010-3.</p>
    </div>
  );
}
