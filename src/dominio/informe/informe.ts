import { aea770, calcularVivienda, fmt, semaforoCaida, type Fuente, type Norma, type Paso, type Semaforo, type TipoCircuito } from "../calculo";
import { elementosDeCircuito, contarBocas, largoDeCircuito } from "../circuitos/largo";
import { validarProyecto, type Hallazgo } from "../circuitos/validar";
import { calcularComputo } from "../computo/computo";
import type { Presupuesto } from "../computo/presupuesto";
import { itemDeCodigo } from "../computo/materiales";
import type { ConfigComputo, LineaComputo } from "../computo/tipos";
import { TENSION_MONOFASICA_V, type Proyecto } from "../proyecto/tipos";
import { modeloUnifilar, type NodoUnifilar } from "../proyecto/unifilar";

export type VersionInforme = "tecnica" | "cliente";

export type SeccionId = "objeto" | "resumen" | "circuitos" | "consolidado" | "unifilar" | "verificaciones" | "despiece" | "presupuesto" | "observaciones" | "firmas";

export const SECCIONES_INFORME: { id: SeccionId; titulo: string }[] = [
  { id: "objeto", titulo: "Objeto y alcance" },
  { id: "resumen", titulo: "Resumen" },
  { id: "circuitos", titulo: "Ficha por circuito" },
  { id: "consolidado", titulo: "Cuadro de circuitos" },
  { id: "unifilar", titulo: "Unifilar" },
  { id: "verificaciones", titulo: "Verificaciones según la norma" },
  { id: "despiece", titulo: "Despiece de materiales" },
  { id: "presupuesto", titulo: "Presupuesto" },
  { id: "observaciones", titulo: "Observaciones" },
  { id: "firmas", titulo: "Firmas" },
];

export interface DatosInstalador {
  nombre: string;
  matricula: string;
  telefono: string;
  email: string;
  /** Imagen como data URL (opcional). */
  logo?: string;
  /** Imagen de la firma como data URL (opcional). */
  firma?: string;
}

export const INSTALADOR_VACIO: DatosInstalador = { nombre: "", matricula: "", telefono: "", email: "" };

export interface OpcionesInforme {
  version: VersionInforme;
  instalador: DatosInstalador;
  cliente: { nombre: string; direccion: string; ciudad: string };
  obra: { numeroInforme: string; fecha: string };
  /** Secciones a incluir; las que no figuran se incluyen. */
  secciones?: Partial<Record<SeccionId, boolean>>;
  objeto?: string;
  observaciones?: string;
  presupuesto?: Presupuesto;
  validezDias?: number;
  condicionesPago?: string;
  configComputo?: ConfigComputo;
  norma?: Norma;
}

export const OBJETO_POR_DEFECTO =
  "Este informe presenta el cálculo de los circuitos de la instalación eléctrica del inmueble indicado, verificado según la Reglamentación AEA 90364-7-770 (edición 2017) para viviendas, con el detalle de protecciones, conductores y materiales.";

export interface CargaInforme {
  nombre: string;
  potenciaUnitarioVA: number;
  cantidad: number;
  subtotalVA: number;
}

export interface FichaCircuito {
  id: string;
  tipo: TipoCircuito;
  nombreTipo: string;
  bocas: number;
  cargas: CargaInforme[];
  largoM: number;
  largoEstimado: boolean;
  largoDesdePlano: boolean;
  potenciaTotalW?: number;
  corrienteA?: number;
  termica?: { calibreA: number; curva: string; capacidadCorteKa?: number };
  conductor?: { seccionMm2: number; corrienteAdmisibleA: number; metodo: string; caidaV?: number; caidaPct?: number; limitePct?: number; semaforo?: Semaforo };
  diferencial?: { sensibilidadMa: number; obligatorio: boolean };
  estado: "ok" | "revisar";
  error?: string;
  /** Solo en la versión técnica. */
  pasos: Paso[];
  advertencias: string[];
  fuentes: Fuente[];
}

export interface FilaConsolidado {
  id: string;
  tipo: TipoCircuito;
  bocas: number;
  corrienteA?: number;
  seccionMm2?: number;
  termicaA?: number;
  diferencialMa?: number;
  largoM: number;
  caidaPct?: number;
  estado: "ok" | "revisar";
}

export interface LineaDespiece {
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  estimado: boolean;
}

export type SeccionInforme =
  | { id: "objeto"; titulo: string; texto: string }
  | { id: "resumen"; titulo: string; grado: string; superficieLimiteM2: number; circuitos: number; potenciaTotalW: number; sistema: string; sinCalcular: string[] }
  | { id: "circuitos"; titulo: string; fichas: FichaCircuito[] }
  | { id: "consolidado"; titulo: string; filas: FilaConsolidado[] }
  | { id: "unifilar"; titulo: string; raiz: NodoUnifilar }
  | { id: "verificaciones"; titulo: string; hallazgos: Hallazgo[] }
  | { id: "despiece"; titulo: string; merma: number; lineas: LineaDespiece[] }
  | { id: "presupuesto"; titulo: string; presupuesto: Presupuesto; validezDias?: number; condicionesPago?: string }
  | { id: "observaciones"; titulo: string; texto: string }
  | { id: "firmas"; titulo: string; cliente: string; instalador: { nombre: string; matricula: string; firma?: string } };

export interface Informe {
  version: VersionInforme;
  caratula: {
    titulo: string;
    obra: string;
    numeroInforme: string;
    cliente: string;
    direccion: string;
    ciudad: string;
    fecha: string;
    normativa: string;
    instalador: DatosInstalador;
  };
  secciones: SeccionInforme[];
  /** "Obra · Cliente", para el pie de cada hoja (la UI agrega "Página N de M"). */
  pie: string;
  avisos: string[];
}

function cargasDe(p: Proyecto, circuitoId: string, tipo: TipoCircuito, norma: Norma): CargaInforme[] {
  const tensionV = p.config.tensionV ?? TENSION_MONOFASICA_V;
  const els = elementosDeCircuito(p, circuitoId);
  const cargas: CargaInforme[] = [];
  const luces = els.filter((e) => e.tipo === "boca_luz").length;
  const va = norma.tiposCircuito.filas.find((f) => f.tipo === tipo)?.potenciaPorBocaVA;
  if (luces > 0 && va != null) cargas.push({ nombre: "Bocas de luz", potenciaUnitarioVA: va, cantidad: luces, subtotalVA: va * luces });
  for (const e of els) {
    const a = e.artefacto;
    if (!a) continue;
    const unit = a.potenciaW ?? (a.corrienteA ?? 0) * tensionV * (a.cosPhi ?? 1);
    cargas.push({ nombre: a.nombre, potenciaUnitarioVA: unit, cantidad: a.cantidad, subtotalVA: unit * a.cantidad });
  }
  return cargas;
}

/** Arma el informe como estructura pura; el render (pantalla, impresión) va en la UI. */
export function armarInforme(p: Proyecto, o: OpcionesInforme): Informe {
  const norma = o.norma ?? aea770;
  const tecnica = o.version === "tecnica";
  const quiere = (id: SeccionId) => o.secciones?.[id] !== false;
  const titulo = (id: SeccionId) => SECCIONES_INFORME.find((s) => s.id === id)!.titulo;
  const secciones: SeccionInforme[] = [];
  const avisos: string[] = [];

  const viv = calcularVivienda({ superficieM2: p.superficieM2, superficieSemicubiertaM2: p.superficieSemicubiertaM2, ambientes: [] }, norma);
  const calculados = p.circuitos.filter((c) => c.resultado);
  const sinCalcular = p.circuitos.filter((c) => !c.resultado).map((c) => c.id);
  if (sinCalcular.length > 0) avisos.push(`Circuitos sin calcular (no entran al informe ni al cómputo): ${sinCalcular.join(", ")}.`);
  if (p.circuitos.some((c) => c.resultado?.advertencias.some((a) => a.includes("PENDIENTE_VERIFICAR")) || c.resultado?.pasos.some((s) => s.advertencia))) {
    avisos.push("Algunos valores de la norma usados en este informe todavía no fueron verificados contra la Guía AEA 770.");
  }

  const fichas: FichaCircuito[] = p.circuitos.map((c) => {
    const r = c.resultado;
    const { largoM, estimado, origen } = largoDeCircuito(c, p);
    const fila = norma.tiposCircuito.filas.find((f) => f.tipo === c.tipo);
    const fuentes = new Map<string, Fuente>();
    r?.pasos.forEach((s) => s.fuente && fuentes.set(`${s.fuente.referencia}|${s.fuente.pagina ?? ""}`, s.fuente));
    return {
      id: c.id,
      tipo: c.tipo,
      nombreTipo: fila?.nombre ?? c.tipo,
      bocas: contarBocas(p, c.id),
      cargas: cargasDe(p, c.id, c.tipo, norma),
      largoM,
      largoEstimado: estimado,
      largoDesdePlano: origen === "plano",
      potenciaTotalW: r?.potenciaTotalW,
      corrienteA: r?.corrienteProyectoA,
      termica: r && { calibreA: r.termicaA, curva: r.curva, capacidadCorteKa: r.capacidadCorteKa },
      conductor: r && {
        seccionMm2: r.seccionMm2,
        corrienteAdmisibleA: r.corrienteAdmisibleA,
        metodo: c.metodoInstalacion,
        caidaV: r.caidaTensionV,
        caidaPct: r.caidaTensionPct,
        limitePct: r.limiteCaidaPct,
        semaforo: r.caidaTensionPct != null && r.limiteCaidaPct != null ? semaforoCaida(r.caidaTensionPct, r.limiteCaidaPct) : undefined,
      },
      diferencial: r?.diferencial,
      estado: r?.cumple ? "ok" : "revisar",
      error: c.error,
      pasos: tecnica ? (r?.pasos ?? []) : [],
      advertencias: r?.advertencias ?? [],
      fuentes: [...fuentes.values()],
    };
  });

  if (quiere("objeto")) secciones.push({ id: "objeto", titulo: titulo("objeto"), texto: o.objeto?.trim() || OBJETO_POR_DEFECTO });
  if (quiere("resumen")) {
    secciones.push({
      id: "resumen",
      titulo: titulo("resumen"),
      grado: viv.grado,
      superficieLimiteM2: viv.superficieLimiteM2,
      circuitos: calculados.length,
      potenciaTotalW: calculados.reduce((s, c) => s + (c.resultado?.potenciaTotalW ?? 0), 0),
      sistema: p.sistema === "trifasico" ? "Trifásico" : "Monofásico",
      sinCalcular,
    });
  }
  if (quiere("circuitos") && tecnica) secciones.push({ id: "circuitos", titulo: titulo("circuitos"), fichas });
  if (quiere("consolidado")) {
    secciones.push({
      id: "consolidado",
      titulo: titulo("consolidado"),
      filas: fichas.map((f) => ({
        id: f.id,
        tipo: f.tipo,
        bocas: f.bocas,
        corrienteA: f.corrienteA,
        seccionMm2: f.conductor?.seccionMm2,
        termicaA: f.termica?.calibreA,
        diferencialMa: f.diferencial?.sensibilidadMa,
        largoM: f.largoM,
        caidaPct: f.conductor?.caidaPct,
        estado: f.estado,
      })),
    });
  }
  if (quiere("unifilar")) secciones.push({ id: "unifilar", titulo: titulo("unifilar"), raiz: modeloUnifilar(p) });
  if (quiere("verificaciones") && tecnica) secciones.push({ id: "verificaciones", titulo: titulo("verificaciones"), hallazgos: validarProyecto(p, norma) });
  if (quiere("despiece") && tecnica) {
    const cfg = o.configComputo;
    const lineas: LineaComputo[] = calcularComputo(p, cfg, norma);
    secciones.push({
      id: "despiece",
      titulo: titulo("despiece"),
      merma: cfg?.desperdicioPct ?? 10,
      lineas: lineas.map((l) => {
        const item = itemDeCodigo(l.codigo);
        return { codigo: l.codigo, descripcion: item?.descripcion ?? l.codigo, unidad: item?.unidad ?? "u", cantidad: l.cantidad, estimado: l.estimado };
      }),
    });
  }
  if (quiere("presupuesto") && o.presupuesto) {
    secciones.push({ id: "presupuesto", titulo: titulo("presupuesto"), presupuesto: o.presupuesto, validezDias: o.validezDias, condicionesPago: o.condicionesPago?.trim() || undefined });
    if (o.presupuesto.sinPrecio.length > 0) avisos.push(`El presupuesto tiene ${o.presupuesto.sinPrecio.length} ítems sin precio: el total está incompleto.`);
  }
  if (quiere("observaciones") && o.observaciones?.trim()) secciones.push({ id: "observaciones", titulo: titulo("observaciones"), texto: o.observaciones.trim() });
  if (quiere("firmas")) {
    secciones.push({ id: "firmas", titulo: titulo("firmas"), cliente: o.cliente.nombre, instalador: { nombre: o.instalador.nombre, matricula: o.instalador.matricula, firma: o.instalador.firma } });
  }

  return {
    version: o.version,
    caratula: {
      titulo: tecnica ? "Informe técnico de instalación eléctrica" : "Informe de instalación eléctrica",
      obra: p.nombre,
      numeroInforme: o.obra.numeroInforme,
      cliente: o.cliente.nombre,
      direccion: o.cliente.direccion,
      ciudad: o.cliente.ciudad,
      fecha: o.obra.fecha,
      normativa: "AEA 90364-7-770, edición 2017 (Guía)",
      instalador: o.instalador,
    },
    secciones,
    pie: [p.nombre, o.cliente.nombre].filter(Boolean).join(" · "),
    avisos,
  };
}

export const textoGrado = (g: string) => g.charAt(0).toUpperCase() + g.slice(1);
export { fmt };
