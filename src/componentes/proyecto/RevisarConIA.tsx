"use client";

import { Boton } from "@/componentes/Boton";
import { RespuestaIA, useAsistente } from "@/componentes/ChatIA";
import type { Hallazgo } from "@/dominio/circuitos/validar";
import { exportarProyecto } from "@/dominio/proyecto/esquema";
import type { Proyecto } from "@/dominio/proyecto/tipos";
import { useState } from "react";

/** Le manda a la IA el proyecto y los hallazgos del validador y muestra sus comentarios. */
export function RevisarConIA({ proyecto, hallazgos }: { proyecto: Proyecto; hallazgos: Hallazgo[] }) {
  const { preguntar, pendiente, actual } = useAsistente();
  const [respuesta, setRespuesta] = useState<Awaited<ReturnType<typeof preguntar>> | null>(null);

  const revisar = async () => {
    setRespuesta(null);
    const contexto = [
      "Proyecto (JSON de backup):",
      exportarProyecto(proyecto),
      "Hallazgos del validador de la app:",
      JSON.stringify(hallazgos.map((h) => ({ severidad: h.severidad, mensaje: h.mensaje, fuente: h.fuente?.referencia, verificado: h.verificado }))),
    ].join("\n");
    setRespuesta(await preguntar("Revisá este proyecto de vivienda: ¿qué es lo más importante a corregir o confirmar? Citá la norma.", { contexto }));
  };

  return (
    <section aria-label="Revisión con IA" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <Boton onClick={revisar} disabled={pendiente}>
        {pendiente ? "Revisando…" : "Revisar con IA"}
      </Boton>
      <p className="text-xs text-slate-500">Manda el proyecto a un servidor con IA (necesita internet y sesión). Los números salen de las calculadoras, no de la IA.</p>
      {(actual ?? respuesta) && <RespuestaIA m={(actual ?? respuesta)!} />}
    </section>
  );
}
