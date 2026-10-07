"use client";

import { Boton } from "@/componentes/Boton";
import { asignarCircuitos, liberarElemento, moverElemento } from "@/dominio/circuitos/asignar";
import type { Proyecto } from "@/dominio/proyecto/tipos";
import { TarjetaCircuito } from "./TarjetaCircuito";

interface Props {
  proyecto: Proyecto;
  abierto: string | null;
  onAbrir: (id: string | null) => void;
  cambiar: (fn: (p: Proyecto) => Proyecto) => void;
}

export function PestanaCircuitos({ proyecto: p, abierto, onAbrir, cambiar }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {p.circuitos.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Todavía no hay circuitos. Agregá elementos en la pestaña Ambientes y se asignan solos.</p>}
      {p.circuitos.map((c) => (
        <TarjetaCircuito
          key={c.id}
          circuito={c}
          proyecto={p}
          abierta={abierto === c.id}
          onAlternar={() => onAbrir(abierto === c.id ? null : c.id)}
          onLargo={(largoM) => cambiar((x) => ({ ...x, circuitos: x.circuitos.map((y) => (y.id === c.id ? { ...y, largoM } : y)) }))}
          onMover={(elementoId, destino) => cambiar((x) => moverElemento(x, elementoId, destino))}
          onLiberar={(elementoId) => cambiar((x) => liberarElemento(x, elementoId))}
        />
      ))}
      <Boton variante="secundario" onClick={() => cambiar((x) => asignarCircuitos(x))}>
        Reasignar automáticamente
      </Boton>
      <p className="text-xs text-slate-500">Los elementos movidos a mano se respetan; tocá &quot;Automático&quot; en un elemento para devolverlo.</p>
    </div>
  );
}
