"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { HojaInferior } from "@/componentes/HojaInferior";
import { Pagina } from "@/componentes/Pagina";
import { validarProyecto } from "@/dominio/circuitos/validar";
import { exportarProyecto, importarProyecto } from "@/dominio/proyecto/esquema";
import { borrarProyecto, guardarProyecto } from "@/integraciones/persistencia/proyectos";
import { descargarTexto, nombreArchivo } from "./archivos";
import { ListaHallazgos } from "./ListaHallazgos";
import { PestanaAmbientes } from "./PestanaAmbientes";
import { PestanaCircuitos } from "./PestanaCircuitos";
import { PestanaTablero } from "./PestanaTablero";
import { RevisarConIA } from "./RevisarConIA";
import { useProyecto } from "./usarProyecto";

type Pestana = "ambientes" | "circuitos" | "tablero" | "validacion";
const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: "ambientes", texto: "Ambientes" },
  { id: "circuitos", texto: "Circuitos" },
  { id: "tablero", texto: "Tablero" },
  { id: "validacion", texto: "Validación" },
];

export function EditorProyecto() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const { proyecto: p, cambiar, falloGuardar } = useProyecto(id);
  const [pestana, setPestana] = useState<Pestana>("ambientes");
  const [ambienteAbierto, setAmbienteAbierto] = useState<string | null>(null);
  const [circuitoAbierto, setCircuitoAbierto] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  const hallazgos = useMemo(() => (p ? validarProyecto(p) : []), [p]);

  if (p === undefined) return <p className="p-4 text-slate-600">Cargando…</p>;
  if (p === null) {
    return (
      <Pagina titulo="Proyecto" atras="/proyectos">
        <p className="rounded-xl bg-white p-4 text-slate-600">No encontramos este proyecto en el dispositivo.</p>
        <Link href="/proyectos" className="flex min-h-12 items-center justify-center rounded-xl bg-amber-500 font-semibold">
          Volver a proyectos
        </Link>
      </Pagina>
    );
  }

  const errores = hallazgos.filter((h) => h.severidad === "error").length;
  const irA = (tab: Pestana, abrir: () => void, anchor: string) => {
    setPestana(tab);
    abrir();
    setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ block: "center" }), 50);
  };

  const importar = async (file: File) => {
    const r = importarProyecto(await file.text());
    if ("error" in r) return setMensaje(r.error);
    await guardarProyecto(r.proyecto);
    setMenu(false);
    router.push(`/proyectos/ver?id=${r.proyecto.id}`);
  };

  return (
    <Pagina titulo={p.nombre} atras="/proyectos">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {p.superficieM2} m² · {p.sistema === "trifasico" ? "Trifásico" : "Monofásico"}
        </span>
        <button type="button" aria-label="Menú del proyecto" onClick={() => setMenu(true)} className="size-11 rounded-lg bg-white text-2xl shadow-sm">
          ⋯
        </button>
      </div>
      {falloGuardar && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          No se pudo guardar en el dispositivo. Exportá el proyecto desde el menú ⋯ para no perder datos.
        </p>
      )}

      <div role="tablist" aria-label="Secciones del proyecto" className="sticky top-0 z-20 -mx-4 flex gap-1 bg-slate-100 px-4 py-2">
        {PESTANAS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={pestana === t.id}
            onClick={() => setPestana(t.id)}
            className={`min-h-11 flex-1 rounded-lg px-1 text-sm font-medium ${pestana === t.id ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          >
            {t.texto}
            {t.id === "validacion" && errores > 0 && <span className="ml-1 rounded-full bg-red-600 px-1.5 text-xs text-white">{errores}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {pestana === "ambientes" && <PestanaAmbientes proyecto={p} hallazgos={hallazgos} abierto={ambienteAbierto} onAbrir={setAmbienteAbierto} cambiar={cambiar} />}
        {pestana === "circuitos" && <PestanaCircuitos proyecto={p} abierto={circuitoAbierto} onAbrir={setCircuitoAbierto} cambiar={cambiar} />}
        {pestana === "tablero" && <PestanaTablero proyecto={p} cambiar={cambiar} />}
        {pestana === "validacion" && (
          <div className="flex flex-col gap-4">
            <ListaHallazgos
              hallazgos={hallazgos}
              onIrAmbiente={(aid) => irA("ambientes", () => setAmbienteAbierto(aid), `ambiente-${aid}`)}
              onIrCircuito={(cid) => irA("circuitos", () => setCircuitoAbierto(cid), `circuito-${cid}`)}
            />
            <RevisarConIA proyecto={p} hallazgos={hallazgos} />
          </div>
        )}
      </div>

      <HojaInferior abierta={menu} titulo="Proyecto" onCerrar={() => setMenu(false)}>
        <div className="flex flex-col gap-2">
          <Boton variante="secundario" onClick={() => descargarTexto(`${nombreArchivo(p.nombre)}.json`, exportarProyecto(p))}>
            Exportar JSON
          </Boton>
          <Boton variante="secundario" onClick={() => archivo.current?.click()}>
            Importar JSON (como proyecto nuevo)
          </Boton>
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            aria-label="Archivo a importar"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importar(f);
              e.target.value = "";
            }}
          />
          {mensaje && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
              {mensaje}
            </p>
          )}
          <Boton
            variante="peligro"
            onClick={async () => {
              if (!window.confirm(`¿Borrar "${p.nombre}"? No se puede deshacer (exportalo antes si querés un backup).`)) return;
              await borrarProyecto(p.id);
              router.push("/proyectos");
            }}
          >
            Borrar proyecto
          </Boton>
        </div>
      </HojaInferior>
    </Pagina>
  );
}
