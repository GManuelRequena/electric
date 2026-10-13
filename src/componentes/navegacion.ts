/** Secciones de la app. La barra inferior (móvil) y la sidebar (desktop) comparten esta lista. */
export interface ItemNav {
  href: string;
  texto: string;
  icono: string;
}

export const ITEMS_NAV: ItemNav[] = [
  { href: "/calcular", texto: "Calcular", icono: "⚡" },
  { href: "/proyectos", texto: "Proyectos", icono: "🏠" },
  { href: "/presupuesto", texto: "Presupuesto", icono: "🧾" },
  { href: "/consultar", texto: "Consultar", icono: "💬" },
];

export const ITEM_AJUSTES: ItemNav = { href: "/ajustes", texto: "Ajustes", icono: "⚙️" };

/** Acción central destacada de la barra inferior. */
export const ACCION_CENTRAL = { href: "/calcular/rapida", texto: "Nuevo cálculo" };

export function estaActivo(ruta: string, href: string): boolean {
  return ruta === href || ruta.startsWith(href + "/");
}
