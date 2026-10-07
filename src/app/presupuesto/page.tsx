"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagina } from "@/componentes/Pagina";
import type { Proyecto } from "@/dominio/proyecto/tipos";
import { listarProyectos } from "@/integraciones/persistencia/proyectos";

export default function Presupuesto() {
  const [lista, setLista] = useState<Proyecto[] | null>(null);

  useEffect(() => {
    let vivo = true;
    listarProyectos().then(
      (l) => vivo && setLista(l),
      () => vivo && setLista([]),
    );
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <Pagina titulo="Presupuesto">
      {lista === null && <p className="text-slate-600">Cargando…</p>}
      {lista?.length === 0 && (
        <p className="rounded-xl bg-white p-4 text-slate-600">
          Todavía no hay proyectos. Armá uno en <Link href="/proyectos" className="font-semibold underline">Proyectos</Link> y acá sale el cómputo de materiales.
        </p>
      )}
      {lista && lista.length > 0 && <p className="text-sm text-slate-600">Elegí un proyecto para ver el cómputo de materiales y armar el presupuesto.</p>}
      <ul aria-label="Proyectos para presupuestar" className="flex flex-col gap-2">
        {lista?.map((p) => (
          <li key={p.id}>
            <Link href={`/presupuesto/ver?id=${p.id}`} className="flex min-h-16 flex-col justify-center rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-lg font-semibold">{p.nombre}</span>
              <span className="text-sm text-slate-600">
                {p.superficieM2} m² · {p.circuitos.length} {p.circuitos.length === 1 ? "circuito" : "circuitos"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/ajustes/precios" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-800">
        Lista de precios
      </Link>
    </Pagina>
  );
}
