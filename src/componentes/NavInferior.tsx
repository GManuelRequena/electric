"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCION_CENTRAL, ITEMS_NAV, estaActivo, type ItemNav } from "./navegacion";

function Item({ item, ruta }: { item: ItemNav; ruta: string }) {
  const activo = estaActivo(ruta, item.href);
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={activo ? "page" : undefined}
        className={`flex h-16 min-h-11 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${activo ? "font-semibold text-marca-fuerte" : "text-texto-suave"}`}
      >
        <span aria-hidden className={`text-lg leading-none transition-transform duration-200 ${activo ? "scale-110" : ""}`}>
          {item.icono}
        </span>
        {item.texto}
      </Link>
    </li>
  );
}

/** Barra inferior para móvil: 2 secciones, acción central y 2 secciones. En desktop la reemplaza la sidebar. */
export function NavInferior() {
  const ruta = usePathname();
  const izquierda = ITEMS_NAV.slice(0, 2);
  const derecha = ITEMS_NAV.slice(2);
  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-2xl items-center">
        {izquierda.map((i) => (
          <Item key={i.href} item={i} ruta={ruta} />
        ))}
        <li className="flex w-20 justify-center">
          <Link
            href={ACCION_CENTRAL.href}
            aria-label={ACCION_CENTRAL.texto}
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-marca text-3xl font-light text-slate-950 shadow-lg transition-transform active:scale-95"
          >
            <span aria-hidden>+</span>
          </Link>
        </li>
        {derecha.map((i) => (
          <Item key={i.href} item={i} ruta={ruta} />
        ))}
      </ul>
    </nav>
  );
}
