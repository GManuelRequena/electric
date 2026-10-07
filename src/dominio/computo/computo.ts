import { aea770, redondear, type Norma } from "../calculo/util";
import { esBoca, largoDeCircuito } from "../circuitos/largo";
import { ES_TECLA, ES_TOMA, type Elemento, type Proyecto } from "../proyecto/tipos";
import { codigoCable, codigoDiferencial, codigoGabinete, codigoTermica, gabineteParaModulos } from "./materiales";
import { CONFIG_COMPUTO_POR_DEFECTO, type ConfigComputo, type LineaComputo } from "./tipos";

interface Acum {
  cantidad: number;
  origen: Set<string>;
  estimado: boolean;
}

class Acumulador {
  private mapa = new Map<string, Acum>();
  sumar(codigo: string, cantidad: number, origen: string, estimado = false) {
    const a = this.mapa.get(codigo) ?? { cantidad: 0, origen: new Set<string>(), estimado: false };
    a.cantidad += cantidad;
    a.origen.add(origen);
    a.estimado ||= estimado;
    this.mapa.set(codigo, a);
  }
  lineas(): LineaComputo[] {
    return [...this.mapa].map(([codigo, a]) => {
      const cantidad = redondear(a.cantidad, 6);
      return { codigo, cantidad: Math.ceil(cantidad), origen: [...a.origen], estimado: a.estimado };
    });
  }
}

/** Módulos DIN de 18 mm que ocupan las protecciones de las líneas (1 por polo). */
export function modulosDeProtecciones(lineas: LineaComputo[]): number {
  let total = 0;
  for (const l of lineas) {
    const m = /^(?:TERMICA|DIF)_(\d)P_/.exec(l.codigo);
    if (m) total += Number(m[1]) * l.cantidad;
  }
  return total;
}

/** Circuitos que no entran al cómputo porque todavía no se pudieron calcular. */
export function circuitosSinCalcular(p: Proyecto): string[] {
  return p.circuitos.filter((c) => !c.resultado).map((c) => c.id);
}

function mecanismosDe(e: Elemento): [string, number][] {
  if (ES_TECLA(e.tipo)) {
    const modulo: [string, number] = e.tipo === "tecla_combinacion" ? ["MOD_TECLA_COMBINACION", 1] : ["MOD_TECLA", e.tipo === "tecla_doble" ? 2 : 1];
    return [modulo, ["BASTIDOR", 1], ["TAPA", 1]];
  }
  if (ES_TOMA(e.tipo)) return [[e.tipo === "toma_especial" ? "MOD_TOMA_20A" : "MOD_TOMA_10A", 1], ["BASTIDOR", 1], ["TAPA", 1]];
  return [];
}

/**
 * Cómputo de materiales del proyecto. Determinista: mismas entradas, mismas líneas.
 * Los circuitos sin calcular no aportan conductores ni protecciones (ver `circuitosSinCalcular`).
 */
export function calcularComputo(p: Proyecto, cfg: ConfigComputo = CONFIG_COMPUTO_POR_DEFECTO, norma: Norma = aea770): LineaComputo[] {
  const acc = new Acumulador();
  const merma = 1 + cfg.desperdicioPct / 100;
  const peMin = norma.seccionesMinimas.filas.find((f) => f.uso === "PE de circuitos terminales")?.seccionMinMm2 ?? 0;
  const polosGenerales = p.sistema === "trifasico" ? 4 : 2;

  for (const c of p.circuitos) {
    const r = c.resultado;
    if (!r) continue;
    const { largoM, estimado } = largoDeCircuito(c, p);
    const metros = largoM * merma;
    acc.sumar(codigoCable(r.seccionMm2, cfg.coloresPorFuncion.fase), metros, c.id, estimado);
    acc.sumar(codigoCable(r.seccionMm2, cfg.coloresPorFuncion.neutro), metros, c.id, estimado);
    if (p.tablero.puestaATierra) acc.sumar(codigoCable(Math.max(r.seccionMm2, peMin), cfg.coloresPorFuncion.pe), metros, c.id, estimado);
    acc.sumar(cfg.canalizacionPorDefecto, metros, c.id, estimado);
    acc.sumar(codigoTermica(1, r.curva, r.termicaA), 1, c.id);

    const bocas = p.elementos.filter((e) => e.circuitoId === c.id && esBoca(e)).length;
    const cajasPaso = Math.ceil(bocas / cfg.bocasPorCajaDePaso);
    if (cajasPaso > 0) acc.sumar("CAJA_PASO", cajasPaso, c.id, true);
  }

  for (const e of p.elementos) {
    if (e.tipo === "artefacto" && e.enchufadoEn) continue; // va a un toma que ya tiene su caja
    acc.sumar(e.tipo === "boca_luz" ? "CAJA_OCTOGONAL" : "CAJA_RECTANGULAR", 1, e.id);
    for (const [codigo, cantidad] of mecanismosDe(e)) acc.sumar(codigo, cantidad, e.id);
  }

  const { termicaA, diferencialMa } = p.tablero.principal;
  const calibreGeneral = termicaA ?? 40; // sin dato se presupuesta un calibre típico, marcado como estimado
  acc.sumar(codigoTermica(polosGenerales, "C", calibreGeneral), 1, "tablero", termicaA == null);
  if (diferencialMa != null) acc.sumar(codigoDiferencial(polosGenerales, calibreGeneral, diferencialMa), 1, "tablero", termicaA == null);

  if (p.tablero.puestaATierra) {
    acc.sumar("JABALINA", 1, "puesta_a_tierra");
    acc.sumar("CAJA_INSPECCION_PAT", 1, "puesta_a_tierra");
    acc.sumar("BORNE_PAT", 1, "puesta_a_tierra");
    acc.sumar(codigoCable(cfg.seccionBajadaPatMm2, cfg.coloresPorFuncion.pe), p.config.metrosHastaTablero * merma, "puesta_a_tierra", true);
  }

  const sinGabinete = acc.lineas();
  const necesarios = Math.ceil(modulosDeProtecciones(sinGabinete) * (1 + cfg.reservaTableroPct / 100));
  acc.sumar(codigoGabinete(gabineteParaModulos(necesarios)), 1, "tablero", true);
  return acc.lineas();
}
