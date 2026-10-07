"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/calcular", texto: "Calcular", icono: "⚡" },
  { href: "/proyectos", texto: "Proyectos", icono: "🏠" },
  { href: "/presupuesto", texto: "Presupuesto", icono: "🧾" },
  { href: "/consultar", texto: "Consultar", icono: "💬" },
];

export function NavInferior() {
  const ruta = usePathname();
  return (
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl">
        {ITEMS.map((i) => {
          const activo = ruta === i.href || ruta.startsWith(i.href + "/");
          return (
            <li key={i.href} className="flex-1">
              <Link
                href={i.href}
                aria-current={activo ? "page" : undefined}
                className={`flex h-16 min-h-11 flex-col items-center justify-center gap-0.5 text-xs ${activo ? "font-semibold text-amber-700" : "text-slate-600"}`}
              >
                <span aria-hidden className="text-lg leading-none">
                  {i.icono}
                </span>
                {i.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
