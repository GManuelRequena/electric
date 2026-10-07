import { aea770, calcularVivienda, fmt, type Fuente, type Norma } from "../calculo";
import { NOMBRES_AMBIENTE, type Proyecto } from "../proyecto/tipos";
import { contarBocas, elementosDeCircuito } from "./largo";

export interface Hallazgo {
  severidad: "error" | "advertencia" | "info";
  mensaje: string; // "Cocina: faltan 2 tomas generales (TUG) para grado medio"
  ambienteId?: string;
  circuitoId?: string;
  fuente?: Fuente;
  /** false si el valor de la norma en que se apoya todavía no fue confirmado contra la Guía. */
  verificado?: boolean;
}

export function validarProyecto(p: Proyecto, norma: Norma = aea770): Hallazgo[] {
  const hs: Hallazgo[] = [];

  // 1) Grado de electrificación y circuitos mínimos
  const viv = calcularVivienda({ superficieM2: p.superficieM2, superficieSemicubiertaM2: p.superficieSemicubiertaM2, ambientes: [] }, norma);
  const filaGrado = norma.gradosElectrificacion.filas.find((g) => g.grado === viv.grado)!;
  hs.push({
    severidad: "info",
    mensaje: `Grado de electrificación ${viv.grado} (Sla ${fmt(viv.superficieLimiteM2)} m²).`,
    fuente: filaGrado.fuente,
    verificado: filaGrado.verificado,
  });
  if (filaGrado.circuitosMinimos == null) {
    hs.push({
      severidad: "info",
      mensaje: `PENDIENTE_VERIFICAR: la cantidad mínima de circuitos del grado ${viv.grado} (Tabla 770.7.II) no está cargada; no se pudo validar.`,
      fuente: filaGrado.fuente,
      verificado: false,
    });
  } else if (p.circuitos.length < filaGrado.circuitosMinimos) {
    hs.push({
      severidad: "error",
      mensaje: `Grado ${viv.grado}: hacen falta al menos ${filaGrado.circuitosMinimos} circuitos y el proyecto tiene ${p.circuitos.length}.`,
      fuente: filaGrado.fuente,
      verificado: filaGrado.verificado,
    });
  }

  // 2) Bocas mínimas por ambiente
  for (const amb of p.ambientes) {
    if (amb.tipo === "otro") continue;
    const nombre = amb.nombre || NOMBRES_AMBIENTE[amb.tipo];
    const reglas = norma.bocasMinimasAmbiente.filas.filter((r) => r.ambiente === amb.tipo);
    if (reglas.length === 0) {
      hs.push({ severidad: "info", mensaje: `${nombre}: PENDIENTE_VERIFICAR, no hay bocas mínimas cargadas para este tipo de ambiente.`, ambienteId: amb.id, verificado: false });
      continue;
    }
    const min = calcularVivienda(
      { superficieM2: p.superficieM2, superficieSemicubiertaM2: p.superficieSemicubiertaM2, ambientes: [{ tipo: amb.tipo, cantidad: 1, superficieM2: amb.superficieM2, largoM: amb.largoM }] },
      norma,
    ).bocasPorAmbiente[0];
    if (!min) continue;
    const els = p.elementos.filter((e) => e.ambienteId === amb.id);
    const filas: { uno: string; varios: string; minimo: number; tiene: number }[] = [
      { uno: "boca de luz (IUG)", varios: "bocas de luz (IUG)", minimo: min.iluminacion, tiene: els.filter((e) => e.tipo === "boca_luz").length },
      { uno: "toma general (TUG)", varios: "tomas generales (TUG)", minimo: min.tomas, tiene: els.filter((e) => e.tipo === "toma_general").length },
      { uno: "toma especial (TUE)", varios: "tomas especiales (TUE)", minimo: min.especiales, tiene: els.filter((e) => e.tipo === "toma_especial" || e.tipo === "toma_exterior").length },
    ];
    for (const f of filas) {
      if (f.tiene >= f.minimo) continue;
      const faltan = f.minimo - f.tiene;
      hs.push({
        severidad: "error",
        mensaje: `${nombre}: ${faltan === 1 ? "falta 1" : `faltan ${faltan}`} ${faltan === 1 ? f.uno : f.varios} para grado ${viv.grado} (mínimo ${f.minimo}, hay ${f.tiene}).`,
        ambienteId: amb.id,
        fuente: reglas[0].fuente,
        verificado: reglas.every((r) => r.verificado),
      });
    }
  }

  // 3) Elementos sueltos o incompletos
  for (const e of p.elementos) {
    const amb = p.ambientes.find((a) => a.id === e.ambienteId);
    const donde = amb ? `${amb.nombre || NOMBRES_AMBIENTE[amb.tipo]}: ` : "";
    const esTecla = e.tipo.startsWith("tecla");
    if (esTecla && (e.comandaA?.length ?? 0) === 0) {
      hs.push({ severidad: "advertencia", mensaje: `${donde}hay una tecla que no comanda ninguna luz.`, ambienteId: e.ambienteId });
    }
    if (!esTecla && !e.circuitoId) {
      hs.push({ severidad: "advertencia", mensaje: `${donde}hay un elemento sin circuito asignado; reasigná los circuitos.`, ambienteId: e.ambienteId });
    }
  }

  // 4) Cada circuito
  for (const c of p.circuitos) {
    const fila = norma.tiposCircuito.filas.find((f) => f.tipo === c.tipo);
    const bocas = contarBocas(p, c.id);
    const base = { circuitoId: c.id, fuente: fila?.fuente, verificado: fila?.verificado };
    if (fila?.maxBocas != null && bocas > fila.maxBocas) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: tiene ${bocas} bocas y el máximo del ${c.tipo} es ${fila.maxBocas}.` });
    }
    const els = elementosDeCircuito(p, c.id);
    if (c.tipo === "IUG" && els.some((e) => e.tipo.startsWith("toma"))) {
      hs.push({
        ...base,
        severidad: "advertencia",
        mensaje: `${c.id}: mezcla tomas con iluminación. La norma lo admite solo con 2,5 mm² y DPMS de 2200 VA; lo habitual es separar IUG y TUG.`,
      });
    }
    if ((c.tipo === "TUG" || c.tipo === "TUE") && els.some((e) => e.tipo === "boca_luz")) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: hay bocas de luz en un circuito de tomacorrientes.` });
    }
    const propio = els.find((e) => e.artefacto?.requiereCircuitoPropio);
    if (propio && bocas > 1) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: "${propio.artefacto!.nombre}" necesita un circuito propio y comparte con otras bocas.` });
    }

    const r = c.resultado;
    if (!r) {
      hs.push({ ...base, severidad: "advertencia", mensaje: `${c.id}: no se pudo calcular${c.error ? ` (${c.error})` : ""}.` });
      continue;
    }
    if (r.corrienteProyectoA > r.termicaA) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: Ib ${fmt(r.corrienteProyectoA)} A supera la térmica de ${r.termicaA} A (debe cumplirse Ib ≤ In).` });
    }
    if (r.termicaA > r.corrienteAdmisibleA) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: la térmica de ${r.termicaA} A supera la corriente admisible del cable (${fmt(r.corrienteAdmisibleA)} A); debe cumplirse In ≤ Iz.` });
    }
    const secMin = fila?.seccionMinMm2;
    if (secMin != null && r.seccionMm2 < secMin) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: la sección de ${fmt(r.seccionMm2)} mm² es menor que el mínimo de ${fmt(secMin)} mm² para ${c.tipo}.` });
    }
    if (r.caidaTensionPct != null && r.limiteCaidaPct != null && r.caidaTensionPct > r.limiteCaidaPct) {
      hs.push({ ...base, severidad: "error", mensaje: `${c.id}: la caída de tensión de ${fmt(r.caidaTensionPct)} % supera el límite de ${fmt(r.limiteCaidaPct)} %.` });
    }
    if (c.largoEstimado) {
      hs.push({ severidad: "info", circuitoId: c.id, mensaje: `${c.id}: el largo es estimado; cargá el real para verificar la caída de tensión.` });
    }
    if (!r.cumple && !hs.some((h) => h.circuitoId === c.id && h.severidad === "error")) {
      hs.push({ ...base, severidad: "advertencia", mensaje: `${c.id}: el cálculo marca incumplimientos; revisá el detalle del circuito.` });
    }
  }

  // 5) Tablero: diferencial y puesta a tierra
  const dif = norma.diferenciales.filas.find((d) => d.obligatorio);
  const ma = p.tablero.principal.diferencialMa;
  if (ma == null) {
    hs.push({ severidad: "advertencia", mensaje: "El tablero no tiene diferencial: se exige uno de 30 mA en circuitos de iluminación y tomacorrientes.", fuente: dif?.fuente, verificado: dif?.verificado });
  } else if (dif && ma > dif.sensibilidadMaxMa) {
    hs.push({ severidad: "error", mensaje: `El diferencial de ${ma} mA supera la sensibilidad máxima de ${dif.sensibilidadMaxMa} mA para circuitos de iluminación y tomas.`, fuente: dif.fuente, verificado: dif.verificado });
  }
  if (!p.tablero.puestaATierra) {
    const pat = norma.seccionesMinimas.filas.find((s) => s.uso.startsWith("PAT"));
    hs.push({ severidad: "error", mensaje: "Falta la puesta a tierra: todos los circuitos terminales llevan conductor de protección (PE).", fuente: pat?.fuente, verificado: pat?.verificado });
  }
  if (p.tablero.principal.termicaA == null) {
    hs.push({ severidad: "info", mensaje: "Todavía no cargaste la térmica general del tablero." });
  }

  return hs;
}
