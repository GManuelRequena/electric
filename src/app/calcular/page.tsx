"use client";

import Link from "next/link";
import { Pagina } from "@/componentes/Pagina";
import { borrarHistorial, useAlmacen, type CalculoGuardado } from "@/integraciones/persistencia/almacen";

const TARJETAS = [
  { href: "/calcular/artefactos", titulo: "Por artefactos", texto: "Cargá lo que se usa: te da cable, térmica y diferencial.", icono: "🔌" },
  { href: "/calcular/rapida", titulo: "Rápida", texto: "Un circuito suelto con potencia o corriente.", icono: "⚡" },
  { href: "/calcular/caida-tension", titulo: "Caída de tensión", texto: "Verificá, buscá la sección mínima o el largo máximo.", icono: "📉" },
  { href: "/calcular/herramientas", titulo: "Herramientas", texto: "Ohm, potencia en CA, consumo y costo, factor de potencia, fotovoltaico.", icono: "🧰" },
  { href: "/calcular/vivienda", titulo: "Vivienda", texto: "Grado de electrificación y bocas mínimas por ambiente.", icono: "🏠" },
];

export default function Calcular() {
  const [ultimos, setUltimos] = useAlmacen<CalculoGuardado[]>("ultimos", []);
  return (
    <Pagina titulo="Calcular">
      <ul className="flex flex-col gap-3">
        {TARJETAS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-100">
              <span aria-hidden className="text-3xl">
                {t.icono}
              </span>
              <span>
                <span className="block text-lg font-semibold">{t.titulo}</span>
                <span className="block text-sm text-slate-600">{t.texto}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {ultimos.length > 0 && (
        <section aria-label="Historial de cálculos" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600">Historial de cálculos</h2>
            <button type="button" onClick={() => { borrarHistorial(); setUltimos([]); }} className="min-h-11 px-2 text-sm text-slate-600 underline">Borrar historial</button>
          </div>
          <ul className="flex flex-col gap-2">
            {ultimos.map((u) => (
              <li key={u.id}>
                <Link href={u.ruta} className="block min-h-11 rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="font-medium">{u.titulo}</span> · {u.resumen}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link href="/ajustes" className="flex min-h-11 items-center justify-center text-sm text-slate-600 underline">
        Ajustes
      </Link>
    </Pagina>
  );
}
