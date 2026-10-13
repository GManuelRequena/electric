"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ITEMS_NAV, ITEM_AJUSTES, estaActivo, type ItemNav } from "./navegacion";

function Enlace({ item, ruta }: { item: ItemNav; ruta: string }) {
  const activo = estaActivo(ruta, item.href);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={activo ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${activo ? "bg-marca-suave font-semibold text-marca-fuerte" : "text-texto-suave hover:bg-superficie-hundida"}`}
      >
        <span aria-hidden className="text-lg leading-none">
          {item.icono}
        </span>
        {item.texto}
      </Link>
    </li>
  );
}

/** Navegación lateral fija para desktop (≥ 768 px). En móvil la reemplaza la barra inferior. */
export function Sidebar() {
  const ruta = usePathname();
  return (
    <aside className="no-imprimir fixed inset-y-0 left-0 z-30 hidden w-56 flex-col gap-4 border-r border-linea bg-superficie px-3 py-4 md:flex">
      <p className="px-3 text-lg font-bold text-texto">
        <span aria-hidden>⚡ </span>Electricista
      </p>
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-4">
        <ul className="flex flex-col gap-1">
          {ITEMS_NAV.map((i) => (
            <Enlace key={i.href} item={i} ruta={ruta} />
          ))}
        </ul>
        <ul className="mt-auto flex flex-col gap-1 border-t border-linea pt-3">
          <Enlace item={ITEM_AJUSTES} ruta={ruta} />
        </ul>
      </nav>
    </aside>
  );
}
