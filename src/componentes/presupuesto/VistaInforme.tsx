"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AvisoLegal } from "@/componentes/AvisoLegal";
import { AvisoNoVerificado } from "@/componentes/AvisoNoVerificado";
import { Boton } from "@/componentes/Boton";
import { Cita } from "@/componentes/Cita";
import { Pagina } from "@/componentes/Pagina";
import { PuntoSemaforo } from "@/componentes/TarjetaResultado";
import { Segmentado } from "@/componentes/Selector";
import { Unifilar } from "@/componentes/proyecto/Unifilar";
import { useProyecto } from "@/componentes/proyecto/usarProyecto";
import { fmt } from "@/dominio/calculo";
import { calcularComputo } from "@/dominio/computo/computo";
import { armarPresupuesto } from "@/dominio/computo/presupuesto";
import { armarInforme, INSTALADOR_VACIO, SECCIONES_INFORME, textoGrado, type DatosInstalador, type FichaCircuito, type Informe, type SeccionId, type SeccionInforme, type VersionInforme } from "@/dominio/informe/informe";
import { useAlmacen } from "@/integraciones/persistencia/almacen";
import { pesos } from "./formato";
import { useDatosPresupuesto, usePrecios } from "./usarPresupuesto";

const css = (s: string) => s.replace(/["\\\n]/g, " ");

export function VistaInforme() {
  const id = useSearchParams().get("id");
  const { proyecto: p } = useProyecto(id);
  const { datos } = useDatosPresupuesto(id);
  const { precios } = usePrecios();
  const [perfil, , perfilListo] = useAlmacen<DatosInstalador>("perfil", INSTALADOR_VACIO);
  const [version, setVersion] = useState<VersionInforme>("cliente");
  const [apagadas, setApagadas] = useState<SeccionId[]>([]);

  const informe = useMemo<Informe | undefined>(() => {
    if (!p || !datos || !perfilListo) return undefined;
    const presupuesto = armarPresupuesto(calcularComputo(p, datos.config), precios, datos.manoDeObra, p, { cotizacionUsd: datos.cotizacionUsd });
    return armarInforme(p, {
      version,
      instalador: perfil,
      cliente: datos.cliente,
      obra: datos.obra,
      secciones: Object.fromEntries(apagadas.map((s) => [s, false])),
      observaciones: datos.observaciones,
      presupuesto,
      validezDias: datos.validezDias,
      condicionesPago: datos.condicionesPago,
      configComputo: datos.config,
    });
  }, [p, datos, perfil, perfilListo, precios, version, apagadas]);

  if (p === undefined || !informe) return <p className="p-4 text-slate-600">Cargando…</p>;
  if (p === null) {
    return (
      <Pagina titulo="Informe" atras="/presupuesto">
        <p className="rounded-xl bg-white p-4 text-slate-600">No encontramos este proyecto en el dispositivo.</p>
      </Pagina>
    );
  }

  const alternar = (s: SeccionId) => setApagadas((a) => (a.includes(s) ? a.filter((x) => x !== s) : [...a, s]));

  return (
    <div className="flex flex-col gap-4">
      {/* Pie de cada hoja al imprimir: obra, cliente y "Página N de M". */}
      <style>{`@page { size: A4; margin: 18mm 14mm 20mm; @bottom-left { content: "${css(informe.pie)}"; font-size: 9pt; color: #475569; } @bottom-right { content: "Página " counter(page) " de " counter(pages); font-size: 9pt; color: #475569; } }`}</style>

      <div className="no-imprimir flex flex-col gap-3">
        <Pagina titulo="Informe" atras={`/presupuesto/ver?id=${p.id}`}>
          <Segmentado
            etiqueta="Versión"
            valor={version}
            opciones={[
              { valor: "cliente", texto: "Cliente" },
              { valor: "tecnica", texto: "Técnica" },
            ]}
            onCambio={setVersion}
          />
          <details className="rounded-xl border border-slate-200 bg-white">
            <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Secciones a incluir</summary>
            <ul className="flex flex-col border-t border-slate-100">
              {SECCIONES_INFORME.map((s) => (
                <li key={s.id}>
                  <label className="flex min-h-11 items-center gap-3 px-4 text-sm">
                    <input type="checkbox" className="size-5" checked={!apagadas.includes(s.id)} onChange={() => alternar(s.id)} />
                    {s.titulo}
                  </label>
                </li>
              ))}
            </ul>
          </details>
          <Boton onClick={() => window.print()}>Imprimir o guardar como PDF</Boton>
          <p className="text-xs text-slate-500">En el diálogo de impresión elegí “Guardar como PDF”. Desde el celular, después podés compartirlo por WhatsApp o mail.</p>
        </Pagina>
        {informe.avisos.map((a) => (
          <AvisoNoVerificado key={a}>{a}</AvisoNoVerificado>
        ))}
      </div>

      <article aria-label="Informe" className="informe flex flex-col gap-6 rounded-xl bg-white p-4 text-sm text-slate-900">
        <Caratula informe={informe} />
        {informe.secciones.map((s) => (
          <Seccion key={s.id} s={s} />
        ))}
        <AvisoLegal />
      </article>
    </div>
  );
}

function Caratula({ informe: i }: { informe: Informe }) {
  const c = i.caratula;
  return (
    <header className="flex flex-col gap-2 border-b border-slate-200 pb-4">
      {c.instalador.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.instalador.logo} alt="Logo" className="max-h-20 self-start object-contain" />
      )}
      <h1 className="text-2xl font-bold">{c.titulo}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <Dato t="Obra" v={c.obra} />
        <Dato t="N° de informe" v={c.numeroInforme} />
        <Dato t="Cliente" v={c.cliente} />
        <Dato t="Dirección" v={[c.direccion, c.ciudad].filter(Boolean).join(", ")} />
        <Dato t="Fecha" v={c.fecha} />
        <Dato t="Normativa" v={c.normativa} />
        <Dato t="Instalador" v={[c.instalador.nombre, c.instalador.matricula && `Mat. ${c.instalador.matricula}`].filter(Boolean).join(" · ")} />
        <Dato t="Contacto" v={[c.instalador.telefono, c.instalador.email].filter(Boolean).join(" · ")} />
      </dl>
    </header>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  if (!v) return null;
  return (
    <>
      <dt className="text-slate-500">{t}</dt>
      <dd className="font-medium">{v}</dd>
    </>
  );
}

function Seccion({ s }: { s: SeccionInforme }) {
  return (
    <section aria-label={s.titulo} className="flex flex-col gap-2">
      <h2 className="border-b border-slate-200 pb-1 text-lg font-bold">{s.titulo}</h2>
      <Contenido s={s} />
    </section>
  );
}

function Contenido({ s }: { s: SeccionInforme }) {
  switch (s.id) {
    case "objeto":
    case "observaciones":
      return <p className="whitespace-pre-line">{s.texto}</p>;
    case "resumen":
      return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <Dato t="Grado de electrificación" v={`${textoGrado(s.grado)} (Sla ${fmt(s.superficieLimiteM2)} m²)`} />
          <Dato t="Sistema" v={s.sistema} />
          <Dato t="Circuitos" v={String(s.circuitos)} />
          <Dato t="Potencia de los circuitos" v={`${fmt(s.potenciaTotalW, 0)} W`} />
        </dl>
      );
    case "consolidado":
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left">
            <thead className="text-xs text-slate-500">
              <tr>
                {["Circuito", "Bocas", "Ib (A)", "Sección", "Térmica", "Dif.", "Largo", "Caída", ""].map((h) => (
                  <th key={h} className="py-1 pr-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.filas.map((f) => (
                <tr key={f.id} className="border-t border-slate-100">
                  <td className="py-1 pr-2 font-semibold">{f.id}</td>
                  <td className="pr-2">{f.bocas}</td>
                  <td className="pr-2">{f.corrienteA != null ? fmt(f.corrienteA) : "—"}</td>
                  <td className="pr-2">{f.seccionMm2 != null ? `${fmt(f.seccionMm2)} mm²` : "—"}</td>
                  <td className="pr-2">{f.termicaA != null ? `${f.termicaA} A` : "—"}</td>
                  <td className="pr-2">{f.diferencialMa != null ? `${f.diferencialMa} mA` : "—"}</td>
                  <td className="pr-2">{fmt(f.largoM)} m</td>
                  <td className="pr-2">{f.caidaPct != null ? `${fmt(f.caidaPct)} %` : "—"}</td>
                  <td>{f.estado === "ok" ? "✓" : "⚠"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "unifilar":
      return <Unifilar raiz={s.raiz} />;
    case "circuitos":
      return <div className="flex flex-col gap-4">{s.fichas.map((f) => <Ficha key={f.id} f={f} />)}</div>;
    case "verificaciones":
      return (
        <ul className="flex flex-col gap-2">
          {s.hallazgos.map((h, i) => (
            <li key={i} className="flex flex-col gap-1">
              <span>{h.severidad === "error" ? "⚠ " : h.severidad === "advertencia" ? "• " : "ℹ "}{h.mensaje}</span>
              {h.fuente && <Cita fuente={h.fuente} />}
              {h.verificado === false && <AvisoNoVerificado>Se apoya en un valor de la norma sin verificar.</AvisoNoVerificado>}
            </li>
          ))}
        </ul>
      );
    case "despiece":
      return (
        <>
          <p className="text-xs text-slate-500">Cable y caño con {fmt(s.merma)} % de merma.</p>
          <table className="w-full text-left">
            <tbody>
              {s.lineas.map((l) => (
                <tr key={l.codigo} className="border-t border-slate-100">
                  <td className="py-1 pr-2">{l.descripcion}{l.estimado && <em className="ml-1 text-xs text-amber-800">(estimado)</em>}</td>
                  <td className="text-right whitespace-nowrap">{fmt(l.cantidad)} {l.unidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      );
    case "presupuesto":
      return (
        <>
          <table className="w-full text-left">
            <tbody>
              <tr><td>Materiales</td><td className="text-right">{pesos(s.presupuesto.materiales)}</td></tr>
              <tr><td>Mano de obra</td><td className="text-right">{pesos(s.presupuesto.manoDeObra)}</td></tr>
              <tr className="border-t border-slate-300 font-bold"><td>Total</td><td className="text-right">{pesos(s.presupuesto.total)}</td></tr>
            </tbody>
          </table>
          {s.presupuesto.sinPrecio.length > 0 && <AvisoNoVerificado>{s.presupuesto.sinPrecio.length} ítems sin precio no están incluidos en el total.</AvisoNoVerificado>}
          {s.validezDias ? <p>Validez de la oferta: {s.validezDias} días.</p> : null}
          {s.condicionesPago && <p className="whitespace-pre-line">Condiciones de pago: {s.condicionesPago}</p>}
        </>
      );
    case "firmas":
      return (
        <div className="grid grid-cols-2 gap-6 pt-8">
          <div className="flex flex-col gap-1 border-t border-slate-400 pt-1">
            <span className="font-medium">{s.cliente || "Cliente"}</span>
            <span className="text-xs text-slate-500">Cliente · Nombre, DNI y fecha</span>
          </div>
          <div className="flex flex-col gap-1">
            {s.instalador.firma && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.instalador.firma} alt="Firma del instalador" className="max-h-16 self-start object-contain" />
            )}
            <div className="flex flex-col gap-1 border-t border-slate-400 pt-1">
              <span className="font-medium">{s.instalador.nombre || "Instalador"}</span>
              <span className="text-xs text-slate-500">Instalador{s.instalador.matricula ? ` · Mat. ${s.instalador.matricula}` : ""}</span>
            </div>
          </div>
        </div>
      );
  }
}

function Ficha({ f }: { f: FichaCircuito }) {
  return (
    <div className="flex break-inside-avoid flex-col gap-2 rounded-lg border border-slate-200 p-3">
      <h3 className="font-bold">{f.id} · {f.nombreTipo} {f.estado === "ok" ? "✓" : "⚠"}</h3>
      {f.error && <AvisoNoVerificado>{f.error}</AvisoNoVerificado>}
      {f.cargas.length > 0 && (
        <table className="w-full text-left text-xs">
          <thead className="text-slate-500"><tr><th>Carga</th><th>P unit.</th><th>Cant.</th><th className="text-right">Subtotal</th></tr></thead>
          <tbody>
            {f.cargas.map((c, i) => (
              <tr key={i}><td>{c.nombre}</td><td>{fmt(c.potenciaUnitarioVA, 0)} VA</td><td>{c.cantidad}</td><td className="text-right">{fmt(c.subtotalVA, 0)} VA</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <ul className="grid grid-cols-1 gap-1">
        {f.potenciaTotalW != null && <li>Potencia {fmt(f.potenciaTotalW, 0)} W · Ib {fmt(f.corrienteA ?? 0)} A</li>}
        {f.termica && <li>Térmica {f.termica.calibreA} A curva {f.termica.curva}{f.termica.capacidadCorteKa != null ? ` · ${fmt(f.termica.capacidadCorteKa)} kA` : ""}</li>}
        {f.conductor && <li>Cable {fmt(f.conductor.seccionMm2)} mm² · Iz {fmt(f.conductor.corrienteAdmisibleA)} A · método {f.conductor.metodo}</li>}
        {f.conductor?.caidaPct != null && (
          <li className="flex items-center gap-2">
            {f.conductor.semaforo && <PuntoSemaforo estado={f.conductor.semaforo} />}
            Largo {fmt(f.largoM)} m{f.largoEstimado ? " (estimado)" : ""} · caída {fmt(f.conductor.caidaV ?? 0)} V = {fmt(f.conductor.caidaPct)} % (límite {fmt(f.conductor.limitePct ?? 0)} %)
          </li>
        )}
        {f.diferencial && <li>Diferencial {f.diferencial.sensibilidadMa} mA{f.diferencial.obligatorio ? " (obligatorio)" : ""}</li>}
      </ul>
      {f.pasos.length > 0 && (
        <ol className="flex flex-col gap-2 border-t border-slate-100 pt-2">
          {f.pasos.map((p, i) => (
            <li key={i} className="flex flex-col gap-0.5 text-xs">
              <strong>{i + 1}. {p.titulo}</strong>
              {p.formula && <span className="font-mono">{p.formula}</span>}
              <span>{p.detalle}</span>
              {p.fuente && <Cita fuente={p.fuente} />}
              {p.advertencia && <AvisoNoVerificado>{p.advertencia}</AvisoNoVerificado>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
