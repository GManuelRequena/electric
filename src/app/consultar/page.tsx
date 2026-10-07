"use client";

import { useState } from "react";
import { BotonConsultar } from "@/componentes/BotonConsultar";
import { Pagina } from "@/componentes/Pagina";

export default function Consultar() {
  const [pregunta, setPregunta] = useState("");
  return (
    <Pagina titulo="Consultar">
      <p className="text-sm text-slate-600">Escribí tu pregunta: se copia al portapapeles y se abre NotebookLM para que la pegues. Más adelante, un chat con IA dentro de la app.</p>
      <textarea
        aria-label="Pregunta"
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        rows={5}
        placeholder="Ej.: ¿Cuántos TUG puedo poner en un circuito?"
        className="rounded-lg border border-slate-300 bg-white p-3 text-base"
      />
      <BotonConsultar pregunta={pregunta || "(escribí tu pregunta acá)"} />
    </Pagina>
  );
}
