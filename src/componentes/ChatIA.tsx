"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ClaudeAsistente, ErrorAsistente } from "@/integraciones/consulta/claudeAsistente";
import type { CitaFuente, Turno } from "@/integraciones/consulta/asistente";
import { Boton } from "./Boton";
import { Cita } from "./Cita";

interface Mensaje {
  rol: "user" | "assistant";
  texto: string;
  citas?: CitaFuente[];
  herramientas?: string[];
  error?: string;
  sinSesion?: boolean;
}

const CALCULADORAS = ["calcular_circuito", "calcular_vivienda", "validar_proyecto"];

export function Citas({ citas }: { citas: CitaFuente[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);
  if (citas.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-1" aria-label="Citas">
        {citas.map((c, i) => (
          <li key={i}>
            <button type="button" onClick={() => setAbierta(abierta === i ? null : i)} aria-expanded={abierta === i} className="min-h-11 rounded-lg text-left">
              <Cita fuente={c.fuente} />
              {c.verificado === false && <span className="ml-1 text-xs text-amber-800">⚠ sin verificar</span>}
            </button>
          </li>
        ))}
      </ul>
      {abierta != null && (
        <p role="note" className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
          {citas[abierta].texto ?? `${citas[abierta].fuente.norma}, ${citas[abierta].fuente.referencia}: valor calculado a partir de las tablas transcriptas del repo.`}
        </p>
      )}
    </div>
  );
}

/** Burbuja de respuesta, compartida por el chat y por "Revisar con IA". */
export function RespuestaIA({ m }: { m: Mensaje }) {
  const usoCalculadora = m.herramientas?.some((h) => CALCULADORAS.includes(h));
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
      {usoCalculadora && <span className="w-fit rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">🧮 Usó la calculadora</span>}
      <p className="whitespace-pre-wrap">{m.texto || "…"}</p>
      {m.citas && <Citas citas={m.citas} />}
      {m.error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-900">
          {m.error}{" "}
          {m.sinSesion && (
            <Link href="/login?desde=/consultar" className="font-semibold underline">
              Iniciar sesión
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

/** Hook que pregunta al asistente y va armando la respuesta con streaming. */
export function useAsistente() {
  const [pendiente, setPendiente] = useState(false);
  const [actual, setActual] = useState<Mensaje | null>(null);
  const abortar = useRef<AbortController | null>(null);

  const preguntar = async (pregunta: string, opciones: { contexto?: string; historial?: Turno[] } = {}): Promise<Mensaje> => {
    abortar.current = new AbortController();
    setPendiente(true);
    const m: Mensaje = { rol: "assistant", texto: "", herramientas: [] };
    setActual({ ...m });
    try {
      const r = await new ClaudeAsistente().preguntar(pregunta, {
        ...opciones,
        signal: abortar.current.signal,
        onTexto: (t) => {
          m.texto += t;
          setActual({ ...m });
        },
        onHerramienta: (n) => {
          m.herramientas = [...(m.herramientas ?? []), n];
          setActual({ ...m });
        },
      });
      Object.assign(m, { texto: r.texto, citas: r.citas, herramientas: r.herramientasUsadas });
    } catch (e) {
      const err = e instanceof ErrorAsistente ? e : null;
      m.error = err?.message ?? "Sin conexión: el asistente con IA necesita internet.";
      m.sinSesion = err?.estado === 401;
    } finally {
      setPendiente(false);
      setActual(null);
    }
    return { ...m };
  };
  return { preguntar, pendiente, actual, cancelar: () => abortar.current?.abort() };
}

export function ChatIA() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const { preguntar, pendiente, actual } = useAsistente();

  const enviar = async () => {
    const pregunta = texto.trim();
    if (!pregunta || pendiente) return;
    setTexto("");
    const historial: Turno[] = mensajes.filter((m) => !m.error).map((m) => ({ rol: m.rol, texto: m.texto }));
    setMensajes((p) => [...p, { rol: "user", texto: pregunta }]);
    const r = await preguntar(pregunta, { historial: historial.slice(-10) });
    setMensajes((p) => [...p, r]);
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3" aria-label="Conversación" aria-live="polite">
        {mensajes.map((m, i) => (
          <li key={i} className={m.rol === "user" ? "self-end rounded-xl bg-amber-100 px-3 py-2 text-sm" : ""}>
            {m.rol === "user" ? m.texto : <RespuestaIA m={m} />}
          </li>
        ))}
        {actual && (
          <li>
            <RespuestaIA m={actual} />
          </li>
        )}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
        className="sticky bottom-20 flex gap-2 rounded-xl bg-slate-50/95 py-2"
      >
        <textarea
          aria-label="Pregunta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Ej.: ¿Qué térmica va para 3500 W?"
          className="min-h-12 flex-1 rounded-lg border border-slate-300 bg-white p-3 text-base"
        />
        <Boton type="submit" disabled={pendiente || !texto.trim()}>
          Enviar
        </Boton>
      </form>
    </div>
  );
}
