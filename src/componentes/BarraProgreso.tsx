"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Estado = "quieta" | "cargando" | "fin";

/** ¿El clic va a otra pantalla de la app? (mismo origen, distinta ruta o búsqueda, sin modificadores). */
function esNavegacionInterna(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return false;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

/** Línea fina arriba que avanza al tocar un enlace y se completa cuando llega la pantalla. */
export function BarraProgreso() {
  const ruta = usePathname();
  const [estado, setEstado] = useState<Estado>("quieta");
  const [anterior, setAnterior] = useState(ruta);
  const [vuelta, setVuelta] = useState(0);

  // La ruta cambió: la pantalla llegó, se completa la barra.
  if (anterior !== ruta) {
    setAnterior(ruta);
    if (estado === "cargando") setEstado("fin");
  }

  useEffect(() => {
    const alTocar = (e: MouseEvent) => {
      if (!esNavegacionInterna(e)) return;
      setVuelta((v) => v + 1);
      setEstado("cargando");
    };
    // En captura: el <Link> de Next hace preventDefault en su propio handler, y ahí ya no se distingue la navegación.
    document.addEventListener("click", alTocar, true);
    return () => document.removeEventListener("click", alTocar, true);
  }, []);

  // Se apaga sola: al terminar la animación de cierre, o si la navegación nunca llegó (seguridad).
  useEffect(() => {
    if (estado === "quieta") return;
    const t = setTimeout(() => setEstado("quieta"), estado === "fin" ? 400 : 10_000);
    return () => clearTimeout(t);
  }, [estado, vuelta]);

  return (
    <div aria-hidden className="no-imprimir pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      {estado !== "quieta" && <div key={vuelta} className={`h-full bg-marca ${estado === "cargando" ? "nav-progreso" : "nav-progreso-fin"}`} />}
    </div>
  );
}
