"use client";

import { useRef, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { CampoTexto } from "@/componentes/CampoTexto";
import { Pagina } from "@/componentes/Pagina";
import { imagenADataUrl } from "@/componentes/presupuesto/imagen";
import { INSTALADOR_VACIO, type DatosInstalador } from "@/dominio/informe/informe";
import { useAlmacen } from "@/integraciones/persistencia/almacen";

export default function Perfil() {
  const [perfil, setPerfil, listo] = useAlmacen<DatosInstalador>("perfil", INSTALADOR_VACIO);
  const [error, setError] = useState<string | null>(null);
  const logo = useRef<HTMLInputElement>(null);
  const firma = useRef<HTMLInputElement>(null);
  if (!listo) return <Pagina titulo="Perfil del instalador" atras="/ajustes">{null}</Pagina>;

  const poner = (campo: keyof DatosInstalador) => (v: string) => setPerfil((p) => ({ ...p, [campo]: v }));
  const cargar = async (f: File, campo: "logo" | "firma") => {
    setError(null);
    try {
      const url = await imagenADataUrl(f, campo === "logo" ? 400 : 500);
      setPerfil((p) => ({ ...p, [campo]: url }));
    } catch {
      setError("No se pudo leer la imagen. Probá con un PNG o JPG.");
    }
  };

  return (
    <Pagina titulo="Perfil del instalador" atras="/ajustes">
      <p className="text-sm text-slate-600">Estos datos aparecen en la carátula y las firmas del informe. Quedan solo en este dispositivo.</p>
      <CampoTexto etiqueta="Nombre y apellido" valor={perfil.nombre} onCambio={poner("nombre")} />
      <CampoTexto etiqueta="Matrícula" valor={perfil.matricula} onCambio={poner("matricula")} />
      <CampoTexto etiqueta="Teléfono" tipo="tel" valor={perfil.telefono} onCambio={poner("telefono")} />
      <CampoTexto etiqueta="Email" tipo="email" valor={perfil.email} onCambio={poner("email")} />

      {(["logo", "firma"] as const).map((campo) => (
        <section key={campo} aria-label={campo === "logo" ? "Logo" : "Firma"} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold">{campo === "logo" ? "Logo (opcional)" : "Imagen de la firma (opcional)"}</h2>
          {perfil[campo] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil[campo]} alt={campo === "logo" ? "Logo cargado" : "Firma cargada"} className="max-h-24 self-start rounded border border-slate-200 bg-white object-contain" />
          )}
          <Boton variante="secundario" onClick={() => (campo === "logo" ? logo : firma).current?.click()}>{perfil[campo] ? "Cambiar imagen" : "Cargar imagen"}</Boton>
          {perfil[campo] && <Boton variante="peligro" onClick={() => setPerfil((p) => ({ ...p, [campo]: undefined }))}>Quitar</Boton>}
          <input
            ref={campo === "logo" ? logo : firma}
            type="file"
            accept="image/*"
            aria-label={campo === "logo" ? "Archivo del logo" : "Archivo de la firma"}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void cargar(f, campo);
              e.target.value = "";
            }}
          />
        </section>
      ))}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
    </Pagina>
  );
}
