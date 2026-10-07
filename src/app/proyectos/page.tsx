"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { HojaInferior } from "@/componentes/HojaInferior";
import { Pagina } from "@/componentes/Pagina";
import { Segmentado, Selector } from "@/componentes/Selector";
import { importarProyecto } from "@/dominio/proyecto/esquema";
import { PLANTILLAS, proyectoDesdePlantilla, superficiePlantilla } from "@/dominio/proyecto/plantillas";
import { proyectoNuevo, type Proyecto } from "@/dominio/proyecto/tipos";
import type { Sistema } from "@/dominio/calculo";
import { guardarProyecto, listarProyectos } from "@/integraciones/persistencia/proyectos";

export default function Proyectos() {
  const router = useRouter();
  const [lista, setLista] = useState<Proyecto[] | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    listarProyectos().then(
      (l) => vivo && setLista(l),
      () => vivo && setLista([]),
    );
    return () => {
      vivo = false;
    };
  }, []);

  const importar = async (file: File) => {
    const r = importarProyecto(await file.text());
    if ("error" in r) return setError(r.error);
    await guardarProyecto(r.proyecto);
    router.push(`/proyectos/ver?id=${r.proyecto.id}`);
  };

  return (
    <Pagina titulo="Proyectos">
      {lista === null && <p className="text-slate-600">Cargando…</p>}
      {lista?.length === 0 && <p className="rounded-xl bg-white p-4 text-slate-600">Armá una vivienda por ambientes y la app asigna los circuitos según la norma.</p>}
      <ul aria-label="Proyectos guardados" className="flex flex-col gap-2">
        {lista?.map((p) => (
          <li key={p.id}>
            <Link href={`/proyectos/ver?id=${p.id}`} className="flex min-h-16 flex-col justify-center rounded-xl border border-slate-200 bg-white px-4 py-3">
              <span className="text-lg font-semibold">{p.nombre}</span>
              <span className="text-sm text-slate-600">
                {p.superficieM2} m² · {p.ambientes.length} {p.ambientes.length === 1 ? "ambiente" : "ambientes"} · {p.circuitos.length} {p.circuitos.length === 1 ? "circuito" : "circuitos"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Boton onClick={() => setNuevo(true)}>+ Nuevo proyecto</Boton>
      <Boton variante="secundario" onClick={() => archivo.current?.click()}>
        Importar JSON
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
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
      <HojaInferior abierta={nuevo} titulo="Nuevo proyecto" onCerrar={() => setNuevo(false)}>
        <FormNuevo
          onCrear={async (p) => {
            await guardarProyecto(p);
            router.push(`/proyectos/ver?id=${p.id}`);
          }}
        />
      </HojaInferior>
    </Pagina>
  );
}

function FormNuevo({ onCrear }: { onCrear: (p: Proyecto) => void | Promise<void> }) {
  const [nombre, setNombre] = useState("");
  const [sup, setSup] = useState("");
  const [sistema, setSistema] = useState<Sistema>("monofasico");
  const [plantilla, setPlantilla] = useState("");
  const s = aNumero(sup);
  const pl = PLANTILLAS.find((x) => x.id === plantilla);
  return (
    <div className="flex flex-col gap-3">
      <Selector
        etiqueta="Plantilla"
        valor={plantilla}
        opciones={[{ valor: "", texto: "Proyecto vacío" }, ...PLANTILLAS.map((x) => ({ valor: x.id, texto: x.nombre }))]}
        onCambio={(id) => {
          setPlantilla(id);
          const elegida = PLANTILLAS.find((x) => x.id === id);
          if (elegida) setSup(String(superficiePlantilla(elegida)));
        }}
        ayuda={pl ? `${pl.descripcion} Las medidas son de ejemplo: ajustalas a tu obra.` : undefined}
      />
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Casa de los García" className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
      </label>
      <CampoNumero etiqueta="Superficie" unidad="m²" valor={sup} onCambio={setSup} ayuda="Cubierta; define el grado de electrificación." />
      <Segmentado
        etiqueta="Sistema"
        valor={sistema}
        opciones={[
          { valor: "monofasico", texto: "Monofásico" },
          { valor: "trifasico", texto: "Trifásico" },
        ]}
        onCambio={setSistema}
      />
      <Boton disabled={!s || s <= 0} onClick={() => {
          const datos = { nombre: nombre.trim() || "Vivienda sin nombre", superficieM2: s!, sistema };
          return onCrear(pl ? proyectoDesdePlantilla(pl, datos) : proyectoNuevo(datos));
        }}>
        Crear proyecto
      </Boton>
    </div>
  );
}
