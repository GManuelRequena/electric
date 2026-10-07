"use client";

import { useState } from "react";
import { aNumero, CampoNumero } from "../CampoNumero";

/** Campo numérico que conserva lo que se escribe (por ejemplo "12,") y avisa solo cuando hay un número válido. */
export function NumeroEditable({ etiqueta, valor, onValor, unidad, ayuda, minimo = 0 }: { etiqueta: string; valor: number | undefined; onValor: (n: number | undefined) => void; unidad?: string; ayuda?: string; minimo?: number }) {
  const [texto, setTexto] = useState(valor == null ? "" : String(valor).replace(".", ","));
  return (
    <CampoNumero
      etiqueta={etiqueta}
      unidad={unidad}
      ayuda={ayuda}
      valor={texto}
      onCambio={(v) => {
        setTexto(v);
        const n = aNumero(v);
        if (v.trim() === "") onValor(undefined);
        else if (n != null && n >= minimo) onValor(n);
      }}
    />
  );
}
