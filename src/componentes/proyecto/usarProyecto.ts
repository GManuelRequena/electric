"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { recalcularProyecto } from "@/dominio/circuitos/calcular";
import type { Proyecto } from "@/dominio/proyecto/tipos";
import { guardarProyecto, obtenerProyecto } from "@/integraciones/persistencia/proyectos";

/**
 * Carga un proyecto de IndexedDB. `cambiar` aplica el cambio, reasigna y recalcula los circuitos, y guarda.
 * `undefined` = cargando, `null` = no existe.
 */
export function useProyecto(id: string | null) {
  const [proyecto, setProyecto] = useState<Proyecto | null | undefined>(undefined);
  const [falloGuardar, setFalloGuardar] = useState(false);
  const actual = useRef<Proyecto | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    if (!id) {
      actual.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProyecto(null);
      return;
    }
    obtenerProyecto(id)
      .then((p) => {
        if (!vivo) return;
        actual.current = p ?? null;
        setProyecto(p ?? null);
      })
      .catch(() => {
        if (!vivo) return;
        actual.current = null;
        setProyecto(null);
      });
    return () => {
      vivo = false;
    };
  }, [id]);

  const cambiar = useCallback((fn: (p: Proyecto) => Proyecto, recalcular = true) => {
    const previo = actual.current;
    if (!previo) return;
    const cambiado = fn(previo);
    const nuevo = { ...(recalcular ? recalcularProyecto(cambiado) : cambiado), actualizado: new Date().toISOString() };
    actual.current = nuevo;
    setProyecto(nuevo);
    guardarProyecto(nuevo).then(
      () => setFalloGuardar(false),
      () => setFalloGuardar(true),
    );
  }, []);

  return { proyecto, cambiar, falloGuardar };
}
