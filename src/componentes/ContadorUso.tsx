"use client";

import { useEffect, useState } from "react";

interface Uso {
  mes: string;
  usd: number;
  consultas: number;
  topeUsd: number;
}

export function ContadorUso() {
  const [uso, setUso] = useState<Uso | null>(null);
  const [estado, setEstado] = useState<"cargando" | "ok" | "sin-sesion" | "error">("cargando");
  useEffect(() => {
    fetch("/api/uso")
      .then(async (r) => {
        if (r.status === 401) return setEstado("sin-sesion");
        if (!r.ok) return setEstado("error");
        setUso((await r.json()) as Uso);
        setEstado("ok");
      })
      .catch(() => setEstado("error"));
  }, []);
  return (
    <section aria-label="Uso de la IA" className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      <h2 className="font-semibold">Uso de la IA este mes</h2>
      {estado === "ok" && uso && (
        <>
          <p>
            {uso.usd.toLocaleString("es-AR", { maximumFractionDigits: 2 })} USD de {uso.topeUsd} USD · {uso.consultas} consultas
          </p>
          <progress aria-label="Gasto del mes" value={Math.min(uso.usd, uso.topeUsd)} max={uso.topeUsd} className="h-2 w-full" />
        </>
      )}
      {estado === "sin-sesion" && <p className="text-slate-600">Iniciá sesión en Consultar para ver el gasto.</p>}
      {estado === "error" && <p className="text-slate-600">No disponible (sin conexión o sin servidor).</p>}
      {estado === "cargando" && <p className="text-slate-600">Cargando…</p>}
      <p className="text-xs text-slate-500">El tope se configura en el servidor (TOPE_USD_MES, máximo 20 USD). Es una estimación con los precios publicados.</p>
    </section>
  );
}
