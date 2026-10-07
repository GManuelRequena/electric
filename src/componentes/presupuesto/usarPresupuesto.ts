"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { datosPresupuestoNuevos, type DatosPresupuesto } from "@/dominio/computo/datos";
import type { Precio } from "@/dominio/computo/presupuesto";
import { ManualPriceProvider } from "@/integraciones/precios/ManualPriceProvider";
import { guardarDatosPresupuesto, obtenerDatosPresupuesto } from "@/integraciones/persistencia/presupuestos";

export const proveedorManual = new ManualPriceProvider();

/** Datos de presupuesto del proyecto (mano de obra, cliente, condiciones). `undefined` mientras carga. */
export function useDatosPresupuesto(proyectoId: string | null) {
  const [datos, setDatos] = useState<DatosPresupuesto | undefined>(undefined);
  const actual = useRef<DatosPresupuesto | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    if (!proyectoId) return;
    obtenerDatosPresupuesto(proyectoId).then(
      (d) => vivo && ((actual.current = d), setDatos(d)),
      () => vivo && ((actual.current = datosPresupuestoNuevos(proyectoId)), setDatos(actual.current)),
    );
    return () => {
      vivo = false;
    };
  }, [proyectoId]);

  const cambiar = useCallback((fn: (d: DatosPresupuesto) => DatosPresupuesto) => {
    if (!actual.current) return;
    const nuevo = fn(actual.current);
    actual.current = nuevo;
    setDatos(nuevo);
    void guardarDatosPresupuesto(nuevo).catch(() => undefined);
  }, []);

  return { datos, cambiar };
}

/** Precios cargados, indexados por código. */
export function usePrecios() {
  const [lista, setLista] = useState<Precio[] | undefined>(undefined);

  const recargar = useCallback(async () => {
    try {
      setLista(await proveedorManual.listar());
    } catch {
      setLista([]);
    }
  }, []);

  useEffect(() => {
    // Carga inicial desde IndexedDB.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recargar();
  }, [recargar]);

  return { lista, precios: new Map((lista ?? []).map((p) => [p.codigo, p])), recargar };
}
