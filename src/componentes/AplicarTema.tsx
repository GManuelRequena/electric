"use client";

import { useEffect } from "react";
import { AJUSTES_POR_DEFECTO, useAlmacen, type Tema } from "@/integraciones/persistencia/almacen";

export function resolverTema(tema: Tema, sistemaOscuro: boolean): "claro" | "oscuro" {
  return tema === "auto" ? (sistemaOscuro ? "oscuro" : "claro") : tema;
}

/** Script en línea para el <head>: aplica el tema antes del primer pintado y evita el destello. */
export const SCRIPT_TEMA = `(function(){try{var a=JSON.parse(localStorage.getItem("electricista:ajustes")||"{}");var t=a.tema||"auto";var o=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.tema=t==="auto"?(o?"oscuro":"claro"):t}catch(e){}})()`;

/** Aplica el tema ya (lo usa Ajustes al cambiarlo, porque cada useAlmacen tiene su propio estado). */
export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.tema = resolverTema(tema, window.matchMedia("(prefers-color-scheme: dark)").matches);
}

export function AplicarTema() {
  const [ajustes] = useAlmacen("ajustes", AJUSTES_POR_DEFECTO);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const aplicar = () => {
      document.documentElement.dataset.tema = resolverTema(ajustes.tema, mq.matches);
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [ajustes.tema]);
  return null;
}
