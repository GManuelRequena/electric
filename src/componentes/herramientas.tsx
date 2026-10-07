"use client";

import { useEffect, useState } from "react";
import { registrarCalculo } from "@/integraciones/persistencia/almacen";
import { codificarEstado, leerEstadoDeUrl, urlCompartible } from "@/integraciones/compartir/estado";
import { Boton } from "./Boton";

/** Estado de los campos de una herramienta: arranca desde `?s=` si el link es compartido. */
export function useCampos<T extends Record<string, string>>(base: T) {
  const [campos, setCampos] = useState<T>(base);

  useEffect(() => {
    // La URL solo existe en el cliente: se lee después de hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCampos(leerEstadoDeUrl(window.location.search, base));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poner = (k: keyof T) => (v: string) => setCampos((c) => ({ ...c, [k]: v }));
  return { campos, poner, setCampos };
}

/** Cuando hay resultado (`resumen`) lo anota en el historial con un link que restaura los campos. */
export function useHistorial(titulo: string, ruta: string, campos: Record<string, string>, resumen: string | undefined) {
  useEffect(() => {
    if (!resumen) return;
    const t = setTimeout(() => registrarCalculo({ titulo, resumen, ruta: `${ruta}?s=${codificarEstado(campos)}` }), 1500);
    return () => clearTimeout(t);
  }, [resumen, campos, ruta, titulo]);
}

export function BotonCompartir({ ruta, campos }: { ruta: string; campos: Record<string, string> }) {
  const [msg, setMsg] = useState<string | null>(null);
  const compartir = async () => {
    const url = urlCompartible(window.location.origin, ruta, campos);
    try {
      if (navigator.share) await navigator.share({ title: "Cálculo eléctrico", url });
      else {
        await navigator.clipboard.writeText(url);
        setMsg("Link copiado.");
      }
    } catch {
      setMsg("No se pudo compartir; copiá el link de la barra del navegador.");
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <Boton variante="secundario" onClick={compartir}>Compartir como link</Boton>
      {msg && <p role="status" className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}

export function Resultados({ filas }: { filas: { etiqueta: string; valor: string }[] }) {
  return (
    <dl aria-label="Resultado" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
      {filas.map((f) => (
        <div key={f.etiqueta} className="col-span-2 grid grid-cols-subgrid bg-white px-4 py-3">
          <dt className="text-sm text-slate-600">{f.etiqueta}</dt>
          <dd className="text-right text-lg font-semibold">{f.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ErrorHerramienta({ mensaje }: { mensaje: string }) {
  return <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{mensaje}</p>;
}
