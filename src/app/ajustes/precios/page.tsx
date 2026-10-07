"use client";

import { useRef, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { Pagina } from "@/componentes/Pagina";
import { descargarTexto } from "@/componentes/proyecto/archivos";
import { pesos } from "@/componentes/presupuesto/formato";
import { proveedorManual, usePrecios } from "@/componentes/presupuesto/usarPresupuesto";
import { itemDeCodigo } from "@/dominio/computo/materiales";
import { importarPreciosCsv, importarPreciosXlsx, plantillaPreciosCsv, type ResultadoImportacion } from "@/integraciones/precios/importar";

export default function AjustesPrecios() {
  const { lista, recargar } = usePrecios();
  const archivo = useRef<HTMLInputElement>(null);
  const [resultado, setResultado] = useState<(ResultadoImportacion & { nombre: string }) | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);

  const importar = async (f: File) => {
    setFallo(null);
    try {
      const r = /\.xlsx$/i.test(f.name) ? await importarPreciosXlsx(await f.arrayBuffer()) : importarPreciosCsv(await f.text());
      if (r.precios.length > 0) await proveedorManual.guardar(r.precios);
      setResultado({ ...r, nombre: f.name });
      await recargar();
    } catch {
      setFallo("No se pudo leer el archivo. Usá un .csv o un .xlsx con las columnas de la plantilla.");
    }
  };

  const ultima = (lista ?? []).reduce((m, p) => (p.fecha > m ? p.fecha : m), "");

  return (
    <Pagina titulo="Lista de precios" atras="/ajustes">
      <p className="text-sm text-slate-600">
        Los precios quedan en este dispositivo. Los precios que cargues acá se usan en todos los presupuestos. {ultima ? `Última actualización: ${ultima}.` : "Todavía no cargaste precios."}
      </p>

      <section aria-label="Importar" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Importar CSV o Excel</h2>
        <p className="text-sm text-slate-600">Columnas: <code>codigo, precio, moneda, fecha, proveedor</code>. Moneda y fecha son opcionales (ARS y hoy). Los códigos son los del presupuesto.</p>
        <Boton variante="secundario" onClick={() => descargarTexto("plantilla-precios.csv", plantillaPreciosCsv(), "text/csv")}>Descargar plantilla</Boton>
        <Boton onClick={() => archivo.current?.click()}>Importar archivo</Boton>
        <input
          ref={archivo}
          type="file"
          accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label="Archivo de precios"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importar(f);
            e.target.value = "";
          }}
        />
        {fallo && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900">{fallo}</p>}
        {resultado && (
          <div role="status" className="flex flex-col gap-1 text-sm">
            <p className="font-medium text-emerald-800">{resultado.nombre}: {resultado.precios.length} {resultado.precios.length === 1 ? "precio importado" : "precios importados"}{resultado.errores.length > 0 ? `, ${resultado.errores.length} ${resultado.errores.length === 1 ? "fila rechazada" : "filas rechazadas"}` : ""}.</p>
            {resultado.errores.length > 0 && (
              <ul aria-label="Filas rechazadas" className="list-disc pl-5 text-red-900">
                {resultado.errores.map((e) => <li key={`${e.fila}-${e.motivo}`}>Fila {e.fila}: {e.motivo}</li>)}
              </ul>
            )}
          </div>
        )}
      </section>

      <section aria-label="Precios cargados" className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Precios cargados ({lista?.length ?? 0})</h2>
        <ul className="flex flex-col gap-2">
          {lista?.map((p) => (
            <li key={p.codigo} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{itemDeCodigo(p.codigo)?.descripcion ?? p.codigo}</p>
                <p className="text-xs text-slate-500">{p.codigo} · {p.proveedor} · {p.fecha}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-semibold">{p.moneda === "ARS" ? pesos(p.precioUnitario) : `US$ ${p.precioUnitario}`}</span>
                <button type="button" aria-label={`Borrar el precio de ${p.codigo}`} onClick={async () => { await proveedorManual.borrar(p.codigo); await recargar(); }} className="size-11 rounded-lg text-xl text-red-700">×</button>
              </div>
            </li>
          ))}
        </ul>
        {lista && lista.length > 0 && (
          <Boton variante="peligro" onClick={async () => { if (window.confirm("¿Borrar todos los precios cargados?")) { await proveedorManual.borrarTodos(); await recargar(); setResultado(null); } }}>
            Borrar todos los precios
          </Boton>
        )}
      </section>
    </Pagina>
  );
}
