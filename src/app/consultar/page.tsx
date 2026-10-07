"use client";

import { useState } from "react";
import { BotonConsultar } from "@/componentes/BotonConsultar";
import { ChatIA } from "@/componentes/ChatIA";
import { Pagina } from "@/componentes/Pagina";

export default function Consultar() {
  const [pregunta, setPregunta] = useState("");
  const [notebook, setNotebook] = useState(false);
  return (
    <Pagina titulo="Consultar">
      <p className="text-sm text-slate-600">Chat con IA sobre la AEA 770. Cita la norma y usa las calculadoras de la app para los números; no los calcula ella.</p>
      <ChatIA />
      <section className="flex flex-col gap-2 border-t border-slate-200 pt-3">
        <button type="button" onClick={() => setNotebook((v) => !v)} aria-expanded={notebook} className="min-h-11 text-left text-sm font-medium text-slate-700">
          {notebook ? "▾" : "▸"} Abrir en NotebookLM
        </button>
        {notebook && (
          <>
            <textarea
              aria-label="Pregunta para NotebookLM"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              rows={3}
              placeholder="Se copia al portapapeles y se abre NotebookLM."
              className="rounded-lg border border-slate-300 bg-white p-3 text-base"
            />
            <BotonConsultar pregunta={pregunta || "(escribí tu pregunta acá)"} />
          </>
        )}
      </section>
    </Pagina>
  );
}
