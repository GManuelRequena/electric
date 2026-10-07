import { z } from "zod";
import { validarProyecto } from "@/dominio/circuitos/validar";
import { recalcularProyecto } from "@/dominio/circuitos/calcular";
import { aea770, calcularCircuito, calcularVivienda, ErrorCalculo, metodosDisponibles } from "@/dominio/calculo";
import type { Fuente } from "@/dominio/normas/tipos";
import { esquemaProyecto } from "@/dominio/proyecto/esquema";
import type { Proyecto } from "@/dominio/proyecto/tipos";
import { buscar, cargarIndice } from "./indice";

/** Cita que llega al cliente: la fuente y, si viene de un fragmento, el texto para mostrarlo. */
export interface CitaFuente {
  fuente: Fuente;
  texto?: string;
  verificado?: boolean;
}

export interface ResultadoHerramienta {
  contenido: unknown;
  fuentes: CitaFuente[];
}

export interface Herramienta<T = unknown> {
  nombre: string;
  descripcion: string;
  esquema: z.ZodType<T>;
  ejecutar(entrada: T): ResultadoHerramienta;
}

const artefacto = z.object({
  id: z.string().default(() => Math.random().toString(36).slice(2, 8)),
  nombre: z.string(),
  potenciaW: z.number().positive().optional(),
  corrienteA: z.number().positive().optional(),
  cosPhi: z.number().positive().max(1).optional(),
  cantidad: z.number().positive().default(1),
  simultaneo: z.boolean().default(true),
  requiereCircuitoPropio: z.boolean().optional(),
  categoria: z.enum(["iluminacion", "toma", "fijo"]).optional(),
});

const tipoCircuito = z.enum(["IUG", "TUG", "IUE", "TUE", "ACU", "MBTF", "APM", "ATE", "MBTS", "OCE"]);

const entradaCircuito = z.object({
  sistema: z.enum(["monofasico", "trifasico"]).default("monofasico"),
  tensionV: z.number().positive().describe("Tensión nominal en V: 220 monofásico, 380 trifásico.").optional(),
  artefactos: z.array(artefacto).min(1).describe("Cargas del circuito. Cada una con potenciaW o corrienteA."),
  tipoCircuito: tipoCircuito.optional().describe("Si falta, la calculadora lo sugiere."),
  largoM: z.number().positive().optional().describe("Largo del circuito en metros; sin esto no se verifica la caída de tensión."),
  metodoInstalacion: z.string().optional().describe(`Método de instalación. Valores válidos: ${metodosDisponibles().join(", ")}. Por defecto el primero.`),
  material: z.enum(["cobre", "aluminio"]).default("cobre"),
  curva: z.enum(["B", "C", "D"]).optional(),
  reservaPct: z.number().nonnegative().optional(),
});
type EntradaCircuitoIA = z.infer<typeof entradaCircuito>;

const entradaVivienda = z.object({
  superficieM2: z.number().positive().describe("Superficie cubierta en m²."),
  superficieSemicubiertaM2: z.number().nonnegative().optional(),
  ambientes: z
    .array(z.object({ tipo: z.string().describe("dormitorio, estar-comedor, cocina, bano, lavadero, pasillo, vestibulo, garage, exterior"), cantidad: z.number().int().positive().default(1), superficieM2: z.number().positive().optional(), largoM: z.number().positive().optional() }))
    .default([]),
});

const entradaProyecto = esquemaProyecto.extend({ creado: z.string().default(""), actualizado: z.string().default("") });

const entradaBuscar = z.object({ consulta: z.string().min(2), k: z.number().int().min(1).max(10).default(5) });
const entradaTabla = z.object({
  id: z.string().describe(`Id de la tabla. Disponibles: ${Object.values(aea770).map((t) => t.id).join(", ")}`),
  filtro: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional().describe("Igualdad por campo, p. ej. {\"tipo\":\"TUG\"}."),
});

function unicas(fuentes: (Fuente | undefined)[]): CitaFuente[] {
  const vistas = new Map<string, CitaFuente>();
  for (const f of fuentes) if (f) vistas.set(`${f.norma}|${f.referencia}|${f.pagina ?? ""}`, { fuente: f });
  return [...vistas.values()];
}

export const HERRAMIENTAS: Herramienta[] = [
  {
    nombre: "calcular_circuito",
    descripcion:
      "Calcula un circuito según la AEA 90364-7-770: corriente de proyecto, sección del cable, térmica, curva, diferencial y caída de tensión, con el paso a paso y las citas. Usala SIEMPRE que haga falta un número (cable, térmica, caída).",
    esquema: entradaCircuito,
    ejecutar(e: EntradaCircuitoIA) {
      const tensionV = e.tensionV ?? (e.sistema === "trifasico" ? aea770Tension.tri : aea770Tension.mono);
      const r = calcularCircuito({
        ...e,
        tensionV,
        metodoInstalacion: e.metodoInstalacion ?? metodosDisponibles()[0],
        artefactos: e.artefactos,
      });
      return { contenido: r, fuentes: unicas(r.pasos.map((p) => p.fuente)) };
    },
  } satisfies Herramienta<EntradaCircuitoIA>,
  {
    nombre: "calcular_vivienda",
    descripcion: "Grado de electrificación, circuitos mínimos y bocas mínimas por ambiente de una vivienda (AEA 770), con el paso a paso y las citas.",
    esquema: entradaVivienda,
    ejecutar(e: z.infer<typeof entradaVivienda>) {
      const r = calcularVivienda(e);
      return { contenido: r, fuentes: unicas(r.pasos.map((p) => p.fuente)) };
    },
  } satisfies Herramienta<z.infer<typeof entradaVivienda>>,
  {
    nombre: "validar_proyecto",
    descripcion: "Valida un proyecto de vivienda (formato de backup de la app): grado, circuitos mínimos, bocas por ambiente, cargas por circuito. Devuelve los hallazgos con su cita.",
    esquema: entradaProyecto,
    ejecutar(e: z.infer<typeof entradaProyecto>) {
      const p = recalcularProyecto(e as unknown as Proyecto);
      const hallazgos = validarProyecto(p);
      return { contenido: hallazgos, fuentes: unicas(hallazgos.map((h) => h.fuente)) };
    },
  } satisfies Herramienta<z.infer<typeof entradaProyecto>>,
  {
    nombre: "buscar_norma",
    descripcion: "Busca fragmentos de la norma (artículos de la Guía AEA 770 ingestada y títulos/notas de las tablas transcriptas). Devuelve texto con su cita. Usala para preguntas conceptuales; si no devuelve nada útil, decí que no está en las fuentes.",
    esquema: entradaBuscar,
    ejecutar(e: z.infer<typeof entradaBuscar>) {
      const res = buscar(cargarIndice(), e.consulta, e.k);
      return {
        contenido: res.map((r) => ({ id: r.fragmento.id, cita: r.fragmento.fuente, texto: r.fragmento.texto })),
        fuentes: res.map((r) => ({ fuente: r.fragmento.fuente, texto: r.fragmento.texto })),
      };
    },
  } satisfies Herramienta<z.infer<typeof entradaBuscar>>,
  {
    nombre: "consultar_tabla",
    descripcion: "Devuelve filas de una tabla transcripta de la norma (src/dominio/normas/aea770) con su fuente y si está verificada. Usala para leer valores normativos puntuales.",
    esquema: entradaTabla,
    ejecutar(e: z.infer<typeof entradaTabla>) {
      const tabla = Object.values(aea770).find((t) => t.id === e.id);
      if (!tabla) throw new ErrorCalculo(`No existe la tabla "${e.id}". Disponibles: ${Object.values(aea770).map((t) => t.id).join(", ")}.`);
      const filas = (tabla.filas as Record<string, unknown>[]).filter((f) => Object.entries(e.filtro ?? {}).every(([k, v]) => f[k] === v));
      return {
        contenido: { id: tabla.id, titulo: tabla.titulo, fuente: tabla.fuente, verificado: tabla.verificado, nota: tabla.nota, totalFilas: filas.length, filas: filas.slice(0, 40) },
        fuentes: [{ fuente: tabla.fuente, verificado: tabla.verificado }, ...filas.slice(0, 40).map((f) => ({ fuente: f.fuente as Fuente, verificado: f.verificado as boolean }))].filter((c) => c.fuente),
      };
    },
  } satisfies Herramienta<z.infer<typeof entradaTabla>>,
];

const aea770Tension = { mono: 220, tri: 380 };

export function definicionesParaApi() {
  return HERRAMIENTAS.map((h) => {
    const { $schema: _omitido, ...input_schema } = z.toJSONSchema(h.esquema, { io: "input", unrepresentable: "any" }) as Record<string, unknown>;
    void _omitido;
    return { name: h.nombre, description: h.descripcion, input_schema: { type: "object" as const, ...input_schema } };
  });
}

const MAX_CARACTERES = 14_000;

/** Ejecuta una herramienta validando la entrada. Nunca lanza: devuelve el error para que el modelo lo corrija. */
export function ejecutarHerramienta(nombre: string, entrada: unknown): { texto: string; esError: boolean; fuentes: CitaFuente[] } {
  const h = HERRAMIENTAS.find((x) => x.nombre === nombre) as Herramienta | undefined;
  if (!h) return { texto: `Herramienta desconocida: ${nombre}`, esError: true, fuentes: [] };
  const parsed = h.esquema.safeParse(entrada);
  if (!parsed.success) {
    return { texto: `Entrada inválida: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`, esError: true, fuentes: [] };
  }
  try {
    const r = h.ejecutar(parsed.data);
    let texto = JSON.stringify(r.contenido);
    if (texto.length > MAX_CARACTERES) texto = `${texto.slice(0, MAX_CARACTERES)}…[recortado]`;
    return { texto, esError: false, fuentes: r.fuentes };
  } catch (e) {
    return { texto: e instanceof Error ? e.message : String(e), esError: true, fuentes: [] };
  }
}
