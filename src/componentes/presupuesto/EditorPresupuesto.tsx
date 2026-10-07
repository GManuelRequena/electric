"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { AvisoNoVerificado } from "@/componentes/AvisoNoVerificado";
import { CampoTexto } from "@/componentes/CampoTexto";
import { Pagina } from "@/componentes/Pagina";
import { Segmentado } from "@/componentes/Selector";
import { useProyecto } from "@/componentes/proyecto/usarProyecto";
import { descargarBytes, nombreArchivo } from "@/componentes/proyecto/archivos";
import { calcularComputo, circuitosSinCalcular } from "@/dominio/computo/computo";
import { rollosNecesarios } from "@/dominio/computo/materiales";
import { armarPresupuesto, type LineaPresupuesto } from "@/dominio/computo/presupuesto";
import { NOMBRES_CATEGORIA, type CategoriaMaterial } from "@/dominio/computo/tipos";
import { presupuestoAXlsx } from "@/integraciones/exportar/presupuestoXlsx";
import { cantidadTexto, fechaHoy, pesos } from "./formato";
import { NumeroEditable } from "./NumeroEditable";
import { proveedorManual, useDatosPresupuesto, usePrecios } from "./usarPresupuesto";

const ORDEN: CategoriaMaterial[] = ["conductores", "canalizaciones", "cajas", "mecanismos", "protecciones", "tablero", "puesta_a_tierra", "varios"];
const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function EditorPresupuesto() {
  const id = useSearchParams().get("id");
  const { proyecto: p } = useProyecto(id);
  const { datos, cambiar } = useDatosPresupuesto(id);
  const { precios, recargar } = usePrecios();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const lineasComputo = useMemo(() => (p && datos ? calcularComputo(p, datos.config) : []), [p, datos]);
  const presupuesto = useMemo(() => (p && datos ? armarPresupuesto(lineasComputo, precios, datos.manoDeObra, p, { cotizacionUsd: datos.cotizacionUsd }) : undefined), [p, datos, lineasComputo, precios]);

  if (p === undefined || datos === undefined || !presupuesto) return <p className="p-4 text-slate-600">Cargando…</p>;
  if (p === null) {
    return (
      <Pagina titulo="Presupuesto" atras="/presupuesto">
        <p className="rounded-xl bg-white p-4 text-slate-600">No encontramos este proyecto en el dispositivo.</p>
      </Pagina>
    );
  }

  const sinCalcular = circuitosSinCalcular(p);
  const hayUsd = presupuesto.lineas.some((l) => l.precio?.moneda === "USD");
  const porCategoria = ORDEN.map((cat) => ({ cat, lineas: presupuesto.lineas.filter((l) => (l.item?.categoria ?? "varios") === cat) })).filter((g) => g.lineas.length > 0);

  const fijarPrecio = async (l: LineaPresupuesto, valor: number | undefined) => {
    if (valor == null) await proveedorManual.borrar(l.codigo);
    else if (valor > 0) {
      const previo = precios.get(l.codigo);
      await proveedorManual.guardar({ codigo: l.codigo, precioUnitario: valor, moneda: previo?.moneda ?? "ARS", fecha: fechaHoy(), proveedor: previo?.proveedor ?? "Manual", url: previo?.url });
    }
    await recargar();
  };

  const exportarExcel = async () => {
    const bytes = await presupuestoAXlsx(presupuesto, { obra: p.nombre, cliente: datos.cliente.nombre, fecha: datos.obra.fecha });
    descargarBytes(`presupuesto-${nombreArchivo(p.nombre)}.xlsx`, bytes, TIPO_XLSX);
  };

  const compartir = async () => {
    const resumen = `Presupuesto ${p.nombre}: materiales ${pesos(presupuesto.materiales)}, mano de obra ${pesos(presupuesto.manoDeObra)}, total ${pesos(presupuesto.total)}.`;
    try {
      const bytes = await presupuestoAXlsx(presupuesto, { obra: p.nombre, cliente: datos.cliente.nombre, fecha: datos.obra.fecha });
      const archivo = new File([bytes], `presupuesto-${nombreArchivo(p.nombre)}.xlsx`, { type: TIPO_XLSX });
      if (navigator.canShare?.({ files: [archivo] })) await navigator.share({ title: `Presupuesto ${p.nombre}`, text: resumen, files: [archivo] });
      else if (navigator.share) await navigator.share({ title: `Presupuesto ${p.nombre}`, text: resumen });
      else {
        await navigator.clipboard.writeText(resumen);
        setMensaje("Este navegador no puede compartir: copiamos el resumen al portapapeles.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setMensaje("No se pudo compartir.");
    }
  };

  return (
    <Pagina titulo={`Presupuesto: ${p.nombre}`} atras="/presupuesto">
      {p.circuitos.length === 0 && <AvisoNoVerificado>El proyecto no tiene circuitos: el cómputo solo incluye cajas, mecanismos y tablero. Cargá ambientes y elementos en el proyecto.</AvisoNoVerificado>}
      {sinCalcular.length > 0 && <AvisoNoVerificado>Circuitos sin calcular (no suman cables ni protecciones): {sinCalcular.join(", ")}. Revisalos en el proyecto.</AvisoNoVerificado>}
      {presupuesto.sinPrecio.length > 0 && (
        <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {presupuesto.sinPrecio.length} {presupuesto.sinPrecio.length === 1 ? "ítem sin precio" : "ítems sin precio"}: no suman al total. Cargalos acá o <Link href="/ajustes/precios" className="font-semibold underline">importá una lista</Link>.
        </p>
      )}

      <section aria-label="Materiales" className="flex flex-col gap-2">
        {porCategoria.map(({ cat, lineas }) => (
          <details key={cat} open className="rounded-xl border border-slate-200 bg-white">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 py-2 text-base font-semibold">
              <span>{NOMBRES_CATEGORIA[cat]}</span>
              <span className="text-sm font-normal text-slate-600">{pesos(lineas.reduce((s, l) => s + (l.subtotal ?? 0), 0))}</span>
            </summary>
            <ul className="flex flex-col divide-y divide-slate-100 border-t border-slate-100">
              {lineas.map((l) => (
                <FilaMaterial key={l.codigo} linea={l} onPrecio={(v) => fijarPrecio(l, v)} />
              ))}
            </ul>
          </details>
        ))}
      </section>

      <section aria-label="Mano de obra" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Mano de obra</h2>
        <Segmentado
          etiqueta="Cómo se cobra"
          valor={datos.manoDeObra.modo}
          opciones={[
            { valor: "por_boca", texto: "Por boca" },
            { valor: "por_hora", texto: "Por hora" },
            { valor: "fijo", texto: "Monto fijo" },
          ]}
          onCambio={(modo) => cambiar((d) => ({ ...d, manoDeObra: { ...d.manoDeObra, modo } }))}
        />
        <NumeroEditable
          key={datos.manoDeObra.modo}
          etiqueta={datos.manoDeObra.modo === "por_boca" ? "Valor por boca" : datos.manoDeObra.modo === "por_hora" ? "Valor de la hora" : "Monto"}
          unidad="ARS"
          valor={datos.manoDeObra.valor || undefined}
          onValor={(valor) => cambiar((d) => ({ ...d, manoDeObra: { ...d.manoDeObra, valor: valor ?? 0 } }))}
        />
        {datos.manoDeObra.modo === "por_hora" && (
          <NumeroEditable etiqueta="Horas" unidad="h" valor={datos.manoDeObra.horas} onValor={(horas) => cambiar((d) => ({ ...d, manoDeObra: { ...d.manoDeObra, horas } }))} />
        )}
      </section>

      <section aria-label="Parámetros" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Parámetros del cómputo</h2>
        <NumeroEditable etiqueta="Desperdicio de cable y caño" unidad="%" valor={datos.config.desperdicioPct} onValor={(v) => cambiar((d) => ({ ...d, config: { ...d.config, desperdicioPct: v ?? 0 } }))} ayuda="Criterio propio, no de la norma." />
        {hayUsd && (
          <NumeroEditable etiqueta="Cotización del dólar" unidad="ARS" valor={datos.cotizacionUsd} onValor={(v) => cambiar((d) => ({ ...d, cotizacionUsd: v }))} ayuda="Los precios en USD cuentan como “sin precio” hasta que la cargues." />
        )}
      </section>

      <section aria-label="Cliente y condiciones" className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Cliente y condiciones</h2>
        <CampoTexto etiqueta="Cliente" valor={datos.cliente.nombre} onCambio={(v) => cambiar((d) => ({ ...d, cliente: { ...d.cliente, nombre: v } }))} />
        <CampoTexto etiqueta="Dirección de la obra" valor={datos.cliente.direccion} onCambio={(v) => cambiar((d) => ({ ...d, cliente: { ...d.cliente, direccion: v } }))} />
        <CampoTexto etiqueta="Ciudad" valor={datos.cliente.ciudad} onCambio={(v) => cambiar((d) => ({ ...d, cliente: { ...d.cliente, ciudad: v } }))} />
        <CampoTexto etiqueta="N° de informe" valor={datos.obra.numeroInforme} onCambio={(v) => cambiar((d) => ({ ...d, obra: { ...d.obra, numeroInforme: v } }))} />
        <NumeroEditable etiqueta="Validez de la oferta" unidad="días" valor={datos.validezDias} onValor={(v) => cambiar((d) => ({ ...d, validezDias: v ?? 0 }))} />
        <CampoTexto etiqueta="Condiciones de pago" multilinea valor={datos.condicionesPago} onCambio={(v) => cambiar((d) => ({ ...d, condicionesPago: v }))} placeholder="50 % al comenzar, 50 % al terminar" />
        <CampoTexto etiqueta="Observaciones" multilinea valor={datos.observaciones} onCambio={(v) => cambiar((d) => ({ ...d, observaciones: v }))} />
      </section>

      <section aria-label="Exportar" className="flex flex-col gap-2">
        <Link href={`/presupuesto/informe?id=${p.id}`} className="flex min-h-12 items-center justify-center rounded-xl bg-amber-500 px-4 font-semibold text-slate-900 active:bg-amber-600">
          Exportar PDF (informe)
        </Link>
        <Boton variante="secundario" onClick={exportarExcel}>Exportar Excel</Boton>
        <Boton variante="secundario" onClick={compartir}>Compartir</Boton>
        {mensaje && <p role="status" className="text-sm text-slate-700">{mensaje}</p>}
      </section>

      <div aria-label="Total" role="region" className="fixed inset-x-0 bottom-16 z-20 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
        <dl className="mx-auto flex max-w-2xl items-center justify-between gap-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Materiales {pesos(presupuesto.materiales)} · M. de obra {pesos(presupuesto.manoDeObra)}</dt>
            <dd className="text-xl font-bold" data-testid="total">{pesos(presupuesto.total)}</dd>
          </div>
        </dl>
      </div>
    </Pagina>
  );
}

function FilaMaterial({ linea: l, onPrecio }: { linea: LineaPresupuesto; onPrecio: (v: number | undefined) => void }) {
  const [texto, setTexto] = useState(l.precio ? String(l.precio.precioUnitario).replace(".", ",") : "");
  const rollos = l.item ? rollosNecesarios(l.item, l.cantidad) : undefined;
  const moneda = l.precio?.moneda ?? "ARS";
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{l.item?.descripcion ?? l.codigo}</p>
          <p className="text-sm text-slate-600">
            {cantidadTexto(l.cantidad)} {l.item?.unidad ?? "u"}
            {rollos != null && l.item?.presentacion && ` (≈ ${rollos} ${rollos === 1 ? "rollo" : "rollos"} de ${l.item.presentacion.cantidad} m)`}
            {l.estimado && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">estimado</span>}
          </p>
          <p className="text-xs text-slate-500">Origen: {l.origen.join(", ")}</p>
        </div>
        <p className="shrink-0 text-right font-semibold">{l.subtotal != null ? pesos(l.subtotal) : "—"}</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <span className="shrink-0">Precio unitario {moneda}</span>
        <input
          aria-label={`Precio unitario ${l.codigo}`}
          inputMode="decimal"
          autoComplete="off"
          value={texto}
          placeholder="Sin precio"
          onChange={(e) => {
            setTexto(e.target.value);
            const t = e.target.value.trim();
            if (t === "") return onPrecio(undefined);
            const n = Number(t.replace(",", "."));
            if (Number.isFinite(n) && n > 0) onPrecio(n);
          }}
          className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>
      {l.precio && <p className="text-xs text-slate-500">{l.precio.proveedor} · {l.precio.fecha}{l.precio.moneda === "USD" && l.precioUnitarioArs == null ? " · falta la cotización del dólar" : ""}</p>}
    </li>
  );
}

