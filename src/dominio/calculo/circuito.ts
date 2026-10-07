import { caidaTension, tensionEnExtremo } from "./caida";
import { corrienteDesdePotencia } from "./corriente";
import { diferencialPara, sugerirCurva } from "./proteccion";
import { elegirSeccion } from "./seccion";
import {
  ErrorCalculo,
  type Artefacto,
  type EntradaCircuito,
  type Paso,
  type ResultadoCircuito,
  type TipoCircuito,
} from "./tipos";
import { agregarAviso, aea770, avisoNoVerificado, fmt, limiteCaida, redondear, resistividadDe, type Norma } from "./util";

/** Corriente de línea de un artefacto (todas sus unidades). */
export function corrienteArtefacto(a: Artefacto, tensionV: number, sistema: EntradaCircuito["sistema"]): number {
  const cos = a.cosPhi ?? 1;
  if (a.corrienteA != null) return a.corrienteA * a.cantidad;
  if (a.potenciaW != null) return corrienteDesdePotencia(a.potenciaW * a.cantidad, tensionV, cos, sistema);
  throw new ErrorCalculo(`El artefacto "${a.nombre}" no tiene potencia ni corriente.`);
}

export function potenciaArtefactoW(a: Artefacto, tensionV: number, sistema: EntradaCircuito["sistema"]): number {
  const cos = a.cosPhi ?? 1;
  if (a.potenciaW != null) return a.potenciaW * a.cantidad;
  const k = sistema === "trifasico" ? Math.sqrt(3) : 1;
  return k * tensionV * (a.corrienteA ?? 0) * a.cantidad * cos;
}

/** Tipo de circuito sugerido según la Guía AEA 770 (pág. 22-24). */
export function sugerirTipoCircuito(e: Pick<EntradaCircuito, "artefactos" | "sistema" | "tensionV">): { tipo: TipoCircuito; motivo: string } {
  const { artefactos, sistema, tensionV } = e;
  const unitaria = (a: Artefacto) => corrienteArtefacto({ ...a, cantidad: 1 }, tensionV, sistema);
  const maxUnitaria = Math.max(...artefactos.map(unitaria));
  const propio = artefactos.some((a) => a.requiereCircuitoPropio);
  if (sistema === "trifasico" || maxUnitaria > 20) {
    return artefactos.length === 1
      ? { tipo: "ACU", motivo: "Carga única que no entra en IUG/TUG/TUE (trifásica o > 20 A): alimentación de carga única." }
      : { tipo: "OCE", motivo: "Cargas que no entran en IUG/TUG/TUE (trifásicas o > 20 A): otros circuitos específicos." };
  }
  if (propio || maxUnitaria > 10) {
    return { tipo: "TUE", motivo: "Consumo unitario > 10 A o equipo con circuito propio: tomacorriente de uso especial." };
  }
  if (artefactos.every((a) => a.categoria === "iluminacion")) {
    return { tipo: "IUG", motivo: "Solo iluminación con consumos ≤ 10 A: iluminación de uso general." };
  }
  return { tipo: "TUG", motivo: "Tomacorrientes con consumos unitarios ≤ 10 A: tomacorrientes de uso general." };
}

export function calcularCircuito(e: EntradaCircuito, norma: Norma = aea770): ResultadoCircuito {
  if (e.artefactos.length === 0) throw new ErrorCalculo("Agregá al menos un artefacto.");
  if (e.artefactos.some((a) => !(a.cantidad > 0))) throw new ErrorCalculo("La cantidad de cada artefacto debe ser mayor que 0.");

  const pasos: Paso[] = [];
  const advertencias: string[] = [];

  // 1) Corriente de proyecto
  const simultaneos = e.artefactos.filter((a) => a.simultaneo);
  const considerados = simultaneos.length > 0 ? simultaneos : [...e.artefactos].sort((a, b) => corrienteArtefacto(b, e.tensionV, e.sistema) - corrienteArtefacto(a, e.tensionV, e.sistema)).slice(0, 1);
  const ibBase = considerados.reduce((s, a) => s + corrienteArtefacto(a, e.tensionV, e.sistema), 0);
  const potenciaTotalW = considerados.reduce((s, a) => s + potenciaArtefactoW(a, e.tensionV, e.sistema), 0);
  const reserva = e.reservaPct ?? 0;
  const ibA = ibBase * (1 + reserva / 100);

  const formula = e.sistema === "trifasico" ? "Ib = P / (√3 · U · cos φ)" : "Ib = P / (U · cos φ)";
  const detallesArtefactos = considerados
    .map((a) => `${a.nombre} ×${a.cantidad}: ${fmt(corrienteArtefacto(a, e.tensionV, e.sistema))} A`)
    .join(" + ");
  pasos.push({
    titulo: "Corriente de proyecto",
    formula,
    detalle:
      `${detallesArtefactos} = ${fmt(ibBase)} A` +
      (reserva > 0 ? `; con reserva de ${fmt(reserva)} %: ${fmt(ibA)} A` : "") +
      `. Potencia considerada: ${fmt(potenciaTotalW, 0)} W a ${fmt(e.tensionV, 0)} V.`,
    fuente: { norma: "Curso Electricista Instalador", edicion: "s/d", referencia: "Módulo 2 (potencia y corriente)", documento: "MODULO_2_EI.pdf" },
  });
  if (simultaneos.length < e.artefactos.length) {
    advertencias.push(
      simultaneos.length === 0
        ? "Ningún artefacto está marcado como simultáneo: se calculó con el de mayor corriente."
        : "Los artefactos no simultáneos no se suman a la corriente de proyecto.",
    );
  }

  // 2) Tipo de circuito
  const sugerido = sugerirTipoCircuito(e);
  const tipo = e.tipoCircuito ?? sugerido.tipo;
  const filaTipo = norma.tiposCircuito.filas.find((f) => f.tipo === tipo);
  pasos.push({
    titulo: "Tipo de circuito",
    detalle: e.tipoCircuito ? `Elegido por el usuario: ${tipo}. Sugerido: ${sugerido.tipo}.` : `${tipo}: ${sugerido.motivo}`,
    fuente: filaTipo?.fuente,
    advertencia: filaTipo ? avisoNoVerificado(filaTipo, `características del circuito ${tipo}`) : undefined,
  });
  if (filaTipo) agregarAviso(advertencias, avisoNoVerificado(filaTipo, `características del circuito ${tipo}`));
  if (filaTipo?.nota?.startsWith("PENDIENTE_VERIFICAR")) advertencias.push(`${tipo}: ${filaTipo.nota}`);
  if (tipo === "IUG") {
    pasos.push({
      titulo: "Nota sobre iluminación",
      detalle: "Para la demanda (DPMS) la norma toma 60 VA por boca × 2/3 (Tabla 770.8.I); este cálculo usa la potencia real cargada.",
    });
  }

  const artefactosConCircuitoPropio = e.artefactos.length > 1 ? e.artefactos.filter((a) => a.requiereCircuitoPropio).map((a) => a.id) : [];
  if (artefactosConCircuitoPropio.length > 0) {
    advertencias.push("Hay artefactos que deberían ir en un circuito propio: " + e.artefactos.filter((a) => artefactosConCircuitoPropio.includes(a.id)).map((a) => a.nombre).join(", ") + ".");
  }

  // 3) Sección mínima de la norma
  let minimaMm2 = filaTipo?.seccionMinMm2 ?? null;
  if (minimaMm2 == null) {
    minimaMm2 = Math.min(...norma.seccionesMinimas.filas.map((f) => f.seccionMinMm2));
    advertencias.push(`PENDIENTE_VERIFICAR: la tabla no tiene sección mínima para ${tipo}; se usó la menor de la norma (${fmt(minimaMm2)} mm²).`);
  }
  const calibreMaxTipoA = filaTipo?.calibreMaxProteccionA ?? null;

  // 4) Caída y sección
  const limite = limiteCaida(tipo, norma);
  const resistividad = resistividadDe(e.material, norma);
  const cos = e.artefactos.length === 1 ? (e.artefactos[0].cosPhi ?? 1) : ponderarCosPhi(considerados, e);
  const hayLargo = e.largoM != null && e.largoM > 0;
  if (!hayLargo) advertencias.push("No se ingresó el largo del circuito: la caída de tensión no se verificó.");
  agregarAviso(advertencias, avisoNoVerificado(resistividad, `resistividad del ${e.material}`));
  agregarAviso(advertencias, avisoNoVerificado(limite, `límite de caída de tensión (${limite.caso})`));

  const sec = elegirSeccion(
    {
      ibA,
      minimaMm2,
      metodoInstalacion: e.metodoInstalacion,
      material: e.material,
      calibreMaxTipoA,
      caida: hayLargo
        ? {
            corrienteA: ibA,
            largoM: e.largoM!,
            resistividadOhmMm2PorM: resistividad.resistividadOhmMm2PorM,
            sistema: e.sistema,
            cosPhi: cos,
            tensionV: e.tensionV,
            limitePct: limite.maxPorcentaje,
          }
        : undefined,
    },
    norma,
  );
  if ("error" in sec) throw new ErrorCalculo(sec.error);
  pasos.push(...sec.pasos);
  for (const a of sec.advertencias) agregarAviso(advertencias, a);

  if (sec.caida) {
    const k = e.sistema === "trifasico" ? "√3" : "2";
    pasos.push({
      titulo: "Caída de tensión",
      formula: `ΔU = ${k} · L · Ib · (ρ / S) · cos φ`,
      detalle:
        `${k} · ${fmt(e.largoM!)} m · ${fmt(ibA)} A · (${resistividad.resistividadOhmMm2PorM} / ${fmt(sec.seccionMm2)}) · ${fmt(cos)} = ${fmt(sec.caida.volts)} V ` +
        `→ ${fmt(sec.caida.pct)} % de ${fmt(e.tensionV, 0)} V (límite ${fmt(limite.maxPorcentaje)} %, ${limite.caso.toLowerCase()}).`,
      fuente: limite.fuente,
      advertencia: avisoNoVerificado(limite, "límite de caída"),
    });
  }
  let tensionExtremoV: number | undefined;
  if (sec.caida && e.tensionOrigenV) {
    tensionExtremoV = tensionEnExtremo(e.tensionOrigenV, sec.caida.volts);
    pasos.push({
      titulo: "Tensión estimada en el extremo",
      detalle: `${fmt(e.tensionOrigenV)} V − ${fmt(sec.caida.volts)} V = ${fmt(tensionExtremoV)} V. La verificación contra el límite sigue siendo en % sobre la tensión nominal de ${fmt(e.tensionV, 0)} V.`,
    });
  }

  // 5) Curva y diferencial
  const sugCurva = sugerirCurva(tipo, norma);
  const curva = e.curva ?? sugCurva.curva;
  pasos.push({
    titulo: "Curva de la térmica",
    detalle: e.curva ? `Elegida por el usuario: ${curva}. ${sugCurva.motivo}` : sugCurva.motivo,
    fuente: sugCurva.fuente,
    advertencia: sugCurva.verificado ? undefined : "Valor sin verificar (curvas de disparo).",
  });
  const dif = diferencialPara(tipo, norma);
  pasos.push({
    titulo: "Diferencial",
    detalle: dif.obligatorio
      ? "30 mA obligatorio en circuitos terminales de iluminación o tomacorrientes."
      : "Sensibilidad de 30 mA recomendada; la Guía lo exige en circuitos de iluminación y tomacorrientes (confirmar para este tipo).",
    fuente: dif.fila.fuente,
  });
  if (!dif.obligatorio) advertencias.push(`PENDIENTE_VERIFICAR: confirmar si el diferencial es obligatorio en circuitos ${tipo}.`);
  if (e.capacidadCorteKa) {
    pasos.push({ titulo: "Capacidad de corte", detalle: `${fmt(e.capacidadCorteKa)} kA (dato configurado; verificar contra la corriente de cortocircuito en el tablero).` });
  }

  // 6) Resultado
  const excedeTipo = calibreMaxTipoA != null && sec.inA > calibreMaxTipoA;
  if (excedeTipo) advertencias.push(`La térmica de ${sec.inA} A supera el máximo del tipo ${tipo} (${calibreMaxTipoA} A).`);
  const cumpleCaida = sec.caida ? sec.caida.pct <= limite.maxPorcentaje : true;

  return {
    potenciaTotalW: redondear(potenciaTotalW, 1),
    corrienteProyectoA: redondear(ibA, 3),
    tipoCircuitoSugerido: sugerido.tipo,
    artefactosConCircuitoPropio,
    seccionMm2: sec.seccionMm2,
    motivoSeccion: sec.motivo,
    corrienteAdmisibleA: sec.izA,
    termicaA: sec.inA,
    curva,
    capacidadCorteKa: e.capacidadCorteKa,
    diferencial: { sensibilidadMa: dif.sensibilidadMa, obligatorio: dif.obligatorio },
    caidaTensionPct: sec.caida ? redondear(sec.caida.pct, 3) : undefined,
    caidaTensionV: sec.caida ? redondear(sec.caida.volts, 3) : undefined,
    limiteCaidaPct: limite.maxPorcentaje,
    tensionExtremoV: tensionExtremoV != null ? redondear(tensionExtremoV, 2) : undefined,
    cumple: !excedeTipo && cumpleCaida && artefactosConCircuitoPropio.length === 0,
    pasos,
    advertencias,
  };
}

/** cos φ medio ponderado por potencia, para la caída en circuitos con varios artefactos. */
function ponderarCosPhi(artefactos: Artefacto[], e: EntradaCircuito): number {
  const total = artefactos.reduce((s, a) => s + potenciaArtefactoW(a, e.tensionV, e.sistema), 0);
  if (total === 0) return 1;
  return artefactos.reduce((s, a) => s + (a.cosPhi ?? 1) * potenciaArtefactoW(a, e.tensionV, e.sistema), 0) / total;
}
