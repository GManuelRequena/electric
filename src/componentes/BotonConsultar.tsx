"use client";

import { useState } from "react";
import { NotebookLmLink } from "@/integraciones/consulta/asistente";
import { AJUSTES_POR_DEFECTO, useAlmacen } from "@/integraciones/persistencia/almacen";
import { Boton } from "./Boton";

export function BotonConsultar({ pregunta, contexto }: { pregunta: string; contexto?: string }) {
  const [ajustes] = useAlmacen("ajustes", AJUSTES_POR_DEFECTO);
  const [estado, setEstado] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <Boton
        variante="secundario"
        onClick={async () => {
          const r = await new NotebookLmLink(ajustes.notebookUrl).consultar(pregunta, contexto);
          setEstado(r.copiado ? "Pregunta copiada: pegala en NotebookLM." : "No se pudo copiar; abrimos NotebookLM igual.");
        }}
      >
        Consultar en NotebookLM
      </Boton>
      {estado && (
        <p role="status" className="text-xs text-slate-600">
          {estado}
        </p>
      )}
    </div>
  );
}
