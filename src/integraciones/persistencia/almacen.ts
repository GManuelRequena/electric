"use client";

import { useCallback, useEffect, useState } from "react";

const PREFIJO = "electricista:";

export function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave);
    return crudo == null ? porDefecto : ({ ...(typeof porDefecto === "object" && !Array.isArray(porDefecto) ? porDefecto : {}), ...(JSON.parse(crudo) as object) } as T extends object ? T : never) as T;
  } catch {
    return porDefecto;
  }
}

export function leerLista<T>(clave: string): T[] {
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave);
    const v = crudo ? JSON.parse(crudo) : [];
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export function guardar(clave: string, valor: unknown): void {
  try {
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento (modo privado o lleno): la app sigue funcionando sin persistir */
  }
}

export function borrarTodo(): void {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIJO))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* nada que borrar */
  }
}

/** Estado persistido en localStorage; arranca con el valor por defecto y hidrata en el cliente. */
export function useAlmacen<T>(clave: string, porDefecto: T): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [valor, setValor] = useState<T>(porDefecto);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Hidratación desde localStorage: no se puede leer en el render del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValor(Array.isArray(porDefecto) ? (leerLista<unknown>(clave) as T) : leer(clave, porDefecto));
    setListo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const actualizar = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValor((prev) => {
        const nuevo = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        guardar(clave, nuevo);
        return nuevo;
      });
    },
    [clave],
  );

  return [valor, actualizar, listo];
}

export type Tema = "auto" | "claro" | "oscuro";

export interface Ajustes {
  tensionMonoV: number;
  tensionTriV: number;
  material: "cobre" | "aluminio";
  notebookUrl: string;
  reservaPct: number;
  capacidadCorteKa: number;
  tema: Tema;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  tensionMonoV: 220,
  tensionTriV: 380,
  material: "cobre",
  notebookUrl: "https://notebook.google.com/notebook/3542ef10-60ec-40f0-9614-6ba471b40320/preview",
  reservaPct: 0,
  capacidadCorteKa: 6,
  tema: "auto",
};

export interface CalculoGuardado {
  id: string;
  fecha: string;
  titulo: string;
  resumen: string;
  ruta: string;
}

export function registrarCalculo(c: Omit<CalculoGuardado, "id" | "fecha">): void {
  const lista = leerLista<CalculoGuardado>("ultimos");
  const nuevo: CalculoGuardado = { ...c, id: String(Date.now()), fecha: new Date().toISOString() };
  guardar("ultimos", [nuevo, ...lista.filter((x) => !(x.titulo === c.titulo && x.resumen === c.resumen))].slice(0, 20));
}

export function borrarHistorial(): void {
  guardar("ultimos", []);
}
