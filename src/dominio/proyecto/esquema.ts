import { z } from "zod";
import { CONFIG_POR_DEFECTO, nuevoId, type Proyecto } from "./tipos";

const artefacto = z.object({
  id: z.string(),
  nombre: z.string(),
  potenciaW: z.number().positive().optional(),
  corrienteA: z.number().positive().optional(),
  cosPhi: z.number().positive().max(1).optional(),
  cantidad: z.number().positive(),
  simultaneo: z.boolean(),
  requiereCircuitoPropio: z.boolean().optional(),
  categoria: z.enum(["iluminacion", "toma", "fijo"]).optional(),
});

const elemento = z.object({
  id: z.string(),
  tipo: z.enum(["boca_luz", "tecla_simple", "tecla_doble", "tecla_combinacion", "toma_general", "toma_especial", "toma_exterior", "artefacto"]),
  ambienteId: z.string(),
  artefacto: artefacto.optional(),
  enchufadoEn: z.string().optional(),
  comandaA: z.array(z.string()).optional(),
  circuitoId: z.string().optional(),
  asignacionManual: z.boolean().optional(),
});

const ambiente = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.enum(["dormitorio", "estar-comedor", "cocina", "bano", "lavadero", "pasillo", "vestibulo", "garage", "exterior", "otro"]),
  superficieM2: z.number().positive().optional(),
  largoM: z.number().positive().optional(),
});

const circuito = z.object({
  id: z.string(),
  tipo: z.enum(["IUG", "TUG", "IUE", "TUE", "ACU", "MBTF", "APM", "ATE", "MBTS", "OCE"]),
  largoM: z.number().positive().optional(),
  metodoInstalacion: z.string(),
});

const punto = z.object({ x: z.number().finite(), y: z.number().finite() });
const plano = z.object({
  ambientes: z.array(punto.extend({ ambienteId: z.string(), anchoM: z.number().positive(), altoM: z.number().positive() })),
  posiciones: z.record(z.string(), punto),
  tablero: punto.optional(),
});

/** Formato del archivo de backup. El resultado de los cálculos no se guarda: se recalcula al importar. */
export const esquemaProyecto = z.object({
  id: z.string().min(1),
  nombre: z.string(),
  tipoInmueble: z.literal("vivienda"),
  norma: z.literal("aea770"),
  superficieM2: z.number().positive(),
  superficieSemicubiertaM2: z.number().nonnegative().optional(),
  sistema: z.enum(["monofasico", "trifasico"]),
  ambientes: z.array(ambiente),
  elementos: z.array(elemento),
  circuitos: z.array(circuito),
  tablero: z.object({ principal: z.object({ termicaA: z.number().positive().optional(), diferencialMa: z.number().positive().optional() }), puestaATierra: z.boolean() }),
  config: z.object({
    metrosPorBoca: z.number().nonnegative().default(CONFIG_POR_DEFECTO.metrosPorBoca),
    metrosHastaTablero: z.number().nonnegative().default(CONFIG_POR_DEFECTO.metrosHastaTablero),
    tensionV: z.number().positive().optional(),
    metodoInstalacion: z.string().optional(),
    alturas: z.object({ tableroM: z.number().nonnegative(), techoM: z.number().nonnegative(), tomaM: z.number().nonnegative() }).optional(),
  }),
  plano: plano.optional(),
  creado: z.string(),
  actualizado: z.string(),
});

export const FORMATO_BACKUP = "electricista-proyecto";

export function exportarProyecto(p: Proyecto): string {
  const circuitos = p.circuitos.map((c) => ({ id: c.id, tipo: c.tipo, largoM: c.largoM, metodoInstalacion: c.metodoInstalacion }));
  return JSON.stringify({ formato: FORMATO_BACKUP, version: 1, proyecto: { ...p, circuitos } }, null, 2);
}

/** Valida el JSON de un backup y devuelve el proyecto con un id nuevo (no pisa uno existente). */
export function importarProyecto(texto: string): { proyecto: Proyecto } | { error: string } {
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return { error: "El archivo no es un JSON válido." };
  }
  const caja = crudo as { formato?: string; proyecto?: unknown };
  if (caja?.formato !== FORMATO_BACKUP) return { error: "No parece un backup de Electricista." };
  const r = esquemaProyecto.safeParse(caja.proyecto);
  if (!r.success) return { error: `El proyecto está incompleto o dañado: ${r.error.issues[0]?.path.join(".")} ${r.error.issues[0]?.message}` };
  return { proyecto: { ...r.data, id: nuevoId(), actualizado: new Date().toISOString() } as Proyecto };
}
