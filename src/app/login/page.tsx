"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoTexto } from "@/componentes/CampoTexto";
import { Pagina } from "@/componentes/Pagina";

function Formulario() {
  const router = useRouter();
  const destino = useSearchParams().get("desde") ?? "/consultar";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (r.ok) return router.push(destino.startsWith("/") ? destino : "/consultar");
      setError(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? "No se pudo iniciar sesión.");
    } catch {
      setError("Sin conexión: el asistente con IA necesita internet.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={entrar} className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">El asistente con IA tiene costo, por eso pide una contraseña. Las calculadoras y los proyectos no la necesitan.</p>
      <CampoTexto etiqueta="Contraseña" tipo="password" valor={password} onCambio={setPassword} />
      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      <Boton type="submit" disabled={enviando || !password}>
        Entrar
      </Boton>
    </form>
  );
}

export default function Login() {
  return (
    <Pagina titulo="Iniciar sesión" atras="/consultar">
      <Suspense>
        <Formulario />
      </Suspense>
    </Pagina>
  );
}
