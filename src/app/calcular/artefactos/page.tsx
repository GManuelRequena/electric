"use client";

import { useEffect, useMemo, useState } from "react";
import { Boton } from "@/componentes/Boton";
import { BotonConsultar } from "@/componentes/BotonConsultar";
import { aNumero, CampoNumero } from "@/componentes/CampoNumero";
import { DetalleCircuito } from "@/componentes/DetalleCircuito";
import { HojaInferior } from "@/componentes/HojaInferior";
import { Pagina } from "@/componentes/Pagina";
import { Segmentado, Selector } from "@/componentes/Selector";
import { TarjetaResultado } from "@/componentes/TarjetaResultado";
import { METODO_POR_DEFECTO, opcionesMetodo } from "@/componentes/opciones";
import {
  aea770,
  calcularCircuito,
  fmt,
  type Artefacto,
  type CategoriaArtefacto,
  type Curva,
  type EntradaCircuito,
  type ResultadoCircuito,
  type TipoCircuito,
} from "@/dominio/calculo";
import { AJUSTES_POR_DEFECTO, registrarCalculo, useAlmacen } from "@/integraciones/persistencia/almacen";

interface ArtefactoUI {
  id: string;
  nombre: string;
  modo: "W" | "A";
  valor: string;
  cosPhi: string;
  cantidad: number;
  simultaneo: boolean;
  propio: boolean;
  categoria: CategoriaArtefacto;
}

interface CircuitoUI {
  id: string;
  nombre: string;
  sistema: "monofasico" | "trifasico";
  tension: string;
  largo: string;
  metodo: string;
  material: "cobre" | "aluminio";
  tipo: "auto" | TipoCircuito;
  curva: "auto" | Curva;
  artefactos: ArtefactoUI[];
}

interface Estado {
  circuitos: CircuitoUI[];
  activo: string;
}

const nuevoId = () => Math.random().toString(36).slice(2, 9);

function circuitoNuevo(n: number): CircuitoUI {
  return { id: nuevoId(), nombre: `Circuito ${n}`, sistema: "monofasico", tension: "", largo: "", metodo: METODO_POR_DEFECTO, material: "cobre", tipo: "auto", curva: "auto", artefactos: [] };
}

const INICIAL: Estado = { circuitos: [circuitoNuevo(1)], activo: "" };

function calcular(c: CircuitoUI, ajustes: typeof AJUSTES_POR_DEFECTO): { r?: ResultadoCircuito; error?: string } {
  if (c.artefactos.length === 0) return {};
  const tensionV = aNumero(c.tension) ?? (c.sistema === "trifasico" ? ajustes.tensionTriV : ajustes.tensionMonoV);
  const artefactos: Artefacto[] = [];
  for (const a of c.artefactos) {
    const v = aNumero(a.valor);
    if (v == null || v <= 0) return { error: `Completá la ${a.modo === "W" ? "potencia" : "corriente"} de "${a.nombre}".` };
    const cos = aNumero(a.cosPhi) ?? 1;
    if (!(cos > 0 && cos <= 1)) return { error: `El cos φ de "${a.nombre}" debe estar entre 0 y 1.` };
    artefactos.push({
      id: a.id,
      nombre: a.nombre,
      potenciaW: a.modo === "W" ? v : undefined,
      corrienteA: a.modo === "A" ? v : undefined,
      cosPhi: cos,
      cantidad: a.cantidad,
      simultaneo: a.simultaneo,
      requiereCircuitoPropio: a.propio,
      categoria: a.categoria,
    });
  }
  const entrada: EntradaCircuito = {
    sistema: c.sistema,
    tensionV,
    artefactos,
    tipoCircuito: c.tipo === "auto" ? undefined : c.tipo,
    curva: c.curva === "auto" ? undefined : c.curva,
    largoM: aNumero(c.largo),
    metodoInstalacion: c.metodo,
    material: c.material,
    reservaPct: ajustes.reservaPct || undefined,
    capacidadCorteKa: ajustes.capacidadCorteKa || undefined,
  };
  try {
    return { r: calcularCircuito(entrada) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo calcular." };
  }
}

export default function CalculoPorArtefactos() {
  const [estado, setEstado] = useAlmacen<Estado>("circuitos", INICIAL);
  const [ajustes] = useAlmacen("ajustes", AJUSTES_POR_DEFECTO);
  const [personalizados, setPersonalizados] = useAlmacen<ArtefactoUI[]>("artefactosPersonalizados", []);
  const [hoja, setHoja] = useState(false);

  const circuito = estado.circuitos.find((c) => c.id === estado.activo) ?? estado.circuitos[0];
  const { r, error } = useMemo(() => calcular(circuito, ajustes), [circuito, ajustes]);

  useEffect(() => {
    if (!r) return;
    const t = setTimeout(() => {
      registrarCalculo({
        titulo: circuito.nombre,
        resumen: `${fmt(r.seccionMm2)} mm² · ${r.termicaA} A ${r.curva}`,
        ruta: "/calcular/artefactos",
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [r, circuito.nombre]);

  const cambiar = (parcial: Partial<CircuitoUI>) =>
    setEstado((e) => ({ ...e, activo: circuito.id, circuitos: e.circuitos.map((c) => (c.id === circuito.id ? { ...c, ...parcial } : c)) }));
  const cambiarArtefacto = (id: string, parcial: Partial<ArtefactoUI>) =>
    cambiar({ artefactos: circuito.artefactos.map((a) => (a.id === id ? { ...a, ...parcial } : a)) });

  return (
    <Pagina titulo="Por artefactos" atras="/calcular">
      <section aria-label="Circuitos" className="flex items-center gap-2 overflow-x-auto pb-1">
        {estado.circuitos.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={c.id === circuito.id}
            onClick={() => setEstado((e) => ({ ...e, activo: c.id }))}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium ${c.id === circuito.id ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
          >
            {c.nombre}
          </button>
        ))}
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-full bg-white px-4 text-sm text-slate-700"
          onClick={() => {
            const n = { ...circuitoNuevo(estado.circuitos.length + 1) };
            setEstado((e) => ({ circuitos: [...e.circuitos, n], activo: n.id }));
          }}
        >
          + Nuevo
        </button>
        <button
          type="button"
          className="min-h-11 shrink-0 rounded-full bg-white px-4 text-sm text-slate-700"
          onClick={() => {
            const copia: CircuitoUI = {
              ...circuito,
              id: nuevoId(),
              nombre: `${circuito.nombre} (copia)`,
              artefactos: circuito.artefactos.map((a) => ({ ...a, id: nuevoId() })),
            };
            setEstado((e) => ({ circuitos: [...e.circuitos, copia], activo: copia.id }));
          }}
        >
          Duplicar
        </button>
      </section>

      <details className="rounded-xl border border-slate-200 bg-white" open={circuito.artefactos.length === 0}>
        <summary className="flex min-h-12 cursor-pointer items-center px-4 font-medium">Opciones del circuito</summary>
        <div className="flex flex-col gap-3 border-t border-slate-200 p-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nombre
            <input value={circuito.nombre} onChange={(e) => cambiar({ nombre: e.target.value })} className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
          </label>
          <Segmentado
            etiqueta="Sistema"
            valor={circuito.sistema}
            opciones={[
              { valor: "monofasico", texto: "Monofásico" },
              { valor: "trifasico", texto: "Trifásico" },
            ]}
            onCambio={(v) => cambiar({ sistema: v })}
          />
          <CampoNumero
            etiqueta="Tensión"
            unidad="V"
            valor={circuito.tension}
            placeholder={String(circuito.sistema === "trifasico" ? ajustes.tensionTriV : ajustes.tensionMonoV)}
            onCambio={(v) => cambiar({ tension: v })}
            ayuda="Vacío = tensión nominal de Ajustes."
          />
          <CampoNumero etiqueta="Largo del circuito (opcional)" unidad="m" valor={circuito.largo} onCambio={(v) => cambiar({ largo: v })} ayuda="Sin largo no se verifica la caída de tensión." />
          <Selector etiqueta="Método de instalación" valor={circuito.metodo} opciones={opcionesMetodo()} onCambio={(v) => cambiar({ metodo: v })} />
          <Segmentado
            etiqueta="Material"
            valor={circuito.material}
            opciones={[
              { valor: "cobre", texto: "Cobre" },
              { valor: "aluminio", texto: "Aluminio" },
            ]}
            onCambio={(v) => cambiar({ material: v })}
          />
          <Selector
            etiqueta="Tipo de circuito"
            valor={circuito.tipo}
            opciones={[{ valor: "auto", texto: "Automático (sugerido)" }, ...aea770.tiposCircuito.filas.map((t) => ({ valor: t.tipo, texto: `${t.tipo} · ${t.nombre}` }))]}
            onCambio={(v) => cambiar({ tipo: v as CircuitoUI["tipo"] })}
          />
          <Selector
            etiqueta="Curva de la térmica"
            valor={circuito.curva}
            opciones={[
              { valor: "auto", texto: "Automática (sugerida)" },
              { valor: "B", texto: "B" },
              { valor: "C", texto: "C" },
              { valor: "D", texto: "D" },
            ]}
            onCambio={(v) => cambiar({ curva: v as CircuitoUI["curva"] })}
          />
        </div>
      </details>

      <section aria-label="Artefactos" className="flex flex-col gap-2">
        {circuito.artefactos.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Todavía no agregaste artefactos.</p>}
        {circuito.artefactos.map((a) => (
          <article key={a.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{a.nombre}</h2>
              <button type="button" aria-label={`Quitar ${a.nombre}`} onClick={() => cambiar({ artefactos: circuito.artefactos.filter((x) => x.id !== a.id) })} className="size-11 text-xl text-red-600">
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <CampoNumero etiqueta={a.modo === "W" ? "Potencia" : "Corriente"} unidad={a.modo} valor={a.valor} onCambio={(v) => cambiarArtefacto(a.id, { valor: v })} />
              <CampoNumero etiqueta="cos φ" valor={a.cosPhi} onCambio={(v) => cambiarArtefacto(a.id, { cosPhi: v })} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1" role="group" aria-label={`Cantidad de ${a.nombre}`}>
                <button type="button" aria-label="Menos" className="size-11 rounded-lg bg-slate-100 text-xl" onClick={() => cambiarArtefacto(a.id, { cantidad: Math.max(1, a.cantidad - 1) })}>
                  −
                </button>
                <span className="w-10 text-center font-semibold" aria-live="polite">
                  {a.cantidad}
                </span>
                <button type="button" aria-label="Más" className="size-11 rounded-lg bg-slate-100 text-xl" onClick={() => cambiarArtefacto(a.id, { cantidad: a.cantidad + 1 })}>
                  +
                </button>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" className="size-5" checked={a.simultaneo} onChange={(e) => cambiarArtefacto(a.id, { simultaneo: e.target.checked })} />
                Simultáneo
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" className="size-5" checked={a.propio} onChange={(e) => cambiarArtefacto(a.id, { propio: e.target.checked })} />
                Circuito propio
              </label>
            </div>
            <button type="button" className="min-h-11 self-start text-sm text-slate-600 underline" onClick={() => cambiarArtefacto(a.id, { modo: a.modo === "W" ? "A" : "W", valor: "" })}>
              Cambiar a {a.modo === "W" ? "corriente (A)" : "potencia (W)"}
            </button>
          </article>
        ))}
        <Boton onClick={() => setHoja(true)} className="w-full">
          + Agregar artefacto
        </Boton>
      </section>

      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {r && (
        <>
          <DetalleCircuito r={r} />
          <BotonConsultar
            pregunta="¿Está bien este circuito según la AEA 90364? Revisá sección, térmica y diferencial."
            contexto={`${circuito.nombre}: ${circuito.artefactos.map((a) => `${a.nombre} ×${a.cantidad}`).join(", ")}. Cable ${fmt(r.seccionMm2)} mm², térmica ${r.termicaA} A curva ${r.curva}, Ib ${fmt(r.corrienteProyectoA)} A.`}
          />
        </>
      )}

      {r && (
        <div className="fixed inset-x-0 bottom-16 z-20 mx-auto max-w-2xl px-4 pb-2">
          <TarjetaResultado r={r} />
        </div>
      )}

      <HojaAgregar
        abierta={hoja}
        onCerrar={() => setHoja(false)}
        personalizados={personalizados}
        onAgregar={(a, guardarPers) => {
          cambiar({ artefactos: [...circuito.artefactos, { ...a, id: nuevoId() }] });
          if (guardarPers) setPersonalizados((p) => [...p.filter((x) => x.nombre !== a.nombre), a]);
          setHoja(false);
        }}
      />
    </Pagina>
  );
}

function HojaAgregar({ abierta, onCerrar, personalizados, onAgregar }: { abierta: boolean; onCerrar: () => void; personalizados: ArtefactoUI[]; onAgregar: (a: ArtefactoUI, guardar: boolean) => void }) {
  const [busqueda, setBusqueda] = useState("");
  const [custom, setCustom] = useState(false);
  const [nombre, setNombre] = useState("");
  const [modo, setModo] = useState<"W" | "A">("W");
  const [valor, setValor] = useState("");
  const [cos, setCos] = useState("1");
  const [cantidad, setCantidad] = useState("1");
  const [simultaneo, setSimultaneo] = useState(true);
  const [propio, setPropio] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const catalogo = aea770.artefactosTipicos.filas.filter((f) => f.nombre.toLowerCase().includes(q));
  const pers = personalizados.filter((f) => f.nombre.toLowerCase().includes(q));

  return (
    <HojaInferior abierta={abierta} titulo={custom ? "Artefacto personalizado" : "Agregar artefacto"} onCerrar={() => { setCustom(false); onCerrar(); }}>
      {!custom ? (
        <div className="flex flex-col gap-3">
          <input
            type="search"
            aria-label="Buscar artefacto"
            placeholder="Buscar (ducha, aire, heladera…)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base"
          />
          <Boton variante="secundario" onClick={() => setCustom(true)}>
            Personalizado
          </Boton>
          <ul className="flex flex-col gap-2">
            {pers.map((p) => (
              <li key={"p" + p.nombre}>
                <button type="button" className="min-h-12 w-full rounded-lg bg-white px-3 py-2 text-left" onClick={() => onAgregar(p, false)}>
                  <span className="font-medium">{p.nombre}</span> <span className="text-sm text-slate-500">· mío · {p.valor} {p.modo}</span>
                </button>
              </li>
            ))}
            {catalogo.map((f) => (
              <li key={f.nombre}>
                <button
                  type="button"
                  className="min-h-12 w-full rounded-lg bg-white px-3 py-2 text-left"
                  onClick={() => onAgregar({ id: "", nombre: f.nombre, modo: "W", valor: String(f.potenciaW), cosPhi: String(f.cosFi), cantidad: 1, simultaneo: true, propio: f.requiereCircuitoPropio, categoria: f.categoria }, false)}
                >
                  <span className="font-medium">{f.nombre}</span> <span className="text-sm text-slate-500">· {fmt(f.potenciaW, 0)} W · cos φ {fmt(f.cosFi)}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">Potencias orientativas, sin verificar: confirmá con el dato de chapa del artefacto.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-12 rounded-lg border border-slate-300 bg-white px-3 text-base font-normal" />
          </label>
          <Segmentado etiqueta="Dato" valor={modo} opciones={[{ valor: "W", texto: "Potencia (W)" }, { valor: "A", texto: "Corriente (A)" }]} onCambio={setModo} />
          <CampoNumero etiqueta={modo === "W" ? "Potencia" : "Corriente"} unidad={modo} valor={valor} onCambio={setValor} />
          <CampoNumero etiqueta="cos φ" valor={cos} onCambio={setCos} ayuda="1 para cargas resistivas." />
          <CampoNumero etiqueta="Cantidad" valor={cantidad} onCambio={setCantidad} />
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-5" checked={simultaneo} onChange={(e) => setSimultaneo(e.target.checked)} />
            Se usa a la vez con el resto
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" className="size-5" checked={propio} onChange={(e) => setPropio(e.target.checked)} />
            Requiere circuito propio
          </label>
          <Boton
            disabled={!nombre.trim() || !(aNumero(valor) && aNumero(valor)! > 0)}
            onClick={() => {
              const cant = Math.max(1, Math.round(aNumero(cantidad) ?? 1));
              onAgregar({ id: "", nombre: nombre.trim(), modo, valor, cosPhi: cos, cantidad: cant, simultaneo, propio, categoria: propio ? "fijo" : "toma" }, true);
              setCustom(false);
              setNombre("");
              setValor("");
            }}
          >
            Agregar y guardar
          </Boton>
        </div>
      )}
    </HojaInferior>
  );
}
