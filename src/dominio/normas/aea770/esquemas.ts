import { z } from "zod";

export const esquemaFuente = z.object({
  norma: z.string().min(1),
  edicion: z.string().min(1),
  referencia: z.string().min(1),
  documento: z.string().min(1),
  pagina: z.number().int().positive().optional(),
});

const meta = {
  fuente: esquemaFuente,
  verificado: z.boolean(),
  nota: z.string().optional(),
};

const tabla = <T extends z.ZodTypeAny>(fila: T) =>
  z.object({
    id: z.string().min(1),
    titulo: z.string().min(1),
    fuente: esquemaFuente,
    verificado: z.boolean(),
    nota: z.string().optional(),
    filas: z.array(fila),
  });

const nulo = (s: z.ZodNumber) => s.nullable();

export const tipoCircuito = z.enum(["IUG", "TUG", "IUE", "TUE", "MBTF", "APM", "ATE", "MBTS", "ACU", "OCE"]);
export const grado = z.enum(["minimo", "medio", "elevado", "superior"]);

export const esquemaTiposCircuito = tabla(
  z.object({
    tipo: tipoCircuito,
    nombre: z.string(),
    alimentacion: z.enum(["monofasica", "trifasica"]),
    maxBocas: nulo(z.number().int().positive()),
    potenciaPorBocaVA: nulo(z.number().positive()),
    potenciaPorCircuitoVA: nulo(z.number().positive()),
    factorSimultaneidad: nulo(z.number().positive()),
    calibreMaxProteccionA: nulo(z.number().positive()),
    seccionMinMm2: nulo(z.number().positive()),
    corrientePorBocaMaxA: nulo(z.number().positive()),
    admiteTomacorrientes: z.boolean(),
    ...meta,
  }),
);

export const esquemaGradosElectrificacion = tabla(
  z.object({
    grado,
    slaMinM2: nulo(z.number().nonnegative()),
    slaMaxM2: nulo(z.number().positive()),
    circuitosMinimos: nulo(z.number().int().positive()),
    ...meta,
  }),
);

export const esquemaBocasMinimasAmbiente = tabla(
  z.object({
    ambiente: z.string(),
    tipoBoca: z.enum(["IUG", "TUG", "TUE"]),
    grados: z.array(grado).min(1),
    cadaM2: nulo(z.number().positive()),
    cadaMLongitudM: nulo(z.number().positive()),
    minimoBocas: z.number().int().nonnegative(),
    ...meta,
  }),
);

export const esquemaSeccionesMinimas = tabla(z.object({ uso: z.string(), seccionMinMm2: z.number().positive(), ...meta }));

export const esquemaCorrientesAdmisibles = tabla(
  z.object({
    metodo: z.string(),
    material: z.enum(["cobre", "aluminio"]),
    conductoresCargados: z.union([z.literal(2), z.literal(3)]),
    seccionMm2: z.number().positive(),
    corrienteAdmisibleA: z.number().positive(),
    ...meta,
  }),
);

export const esquemaFactoresAgrupamiento = tabla(
  z.object({ circuitosPorCano: z.number().int().min(2), factor: z.number().positive().max(1), ...meta }),
);

export const esquemaFactoresTemperatura = tabla(
  z.object({
    temperaturaAmbienteC: z.number(),
    factorEnCanos: z.number().positive(),
    factorAlAire: z.number().positive(),
    ...meta,
  }),
);

export const esquemaFactoresConductoresPorCano = tabla(
  z.object({ conductoresEnCano: z.string(), factor: z.number().positive().max(1), ...meta }),
);

export const esquemaCalibresMaxProteccion = tabla(
  z.object({
    seccionMm2: z.number().positive(),
    circuitosPorCano: z.number().int().positive(),
    calibreMaxA: z.number().positive(),
    ...meta,
  }),
);

export const esquemaCalibresNormalizados = tabla(z.object({ calibreA: z.number().positive(), ...meta }));

export const esquemaCurvasDisparo = tabla(
  z.object({
    curva: z.enum(["B", "C", "D"]),
    minMultiploIn: z.number().positive(),
    maxMultiploIn: z.number().positive(),
    usoTipico: z.string(),
    ...meta,
  }),
);

export const esquemaDiferenciales = tabla(
  z.object({
    sensibilidadMaxMa: z.number().positive(),
    uso: z.string(),
    obligatorio: z.boolean(),
    alcance: z.string(),
    ...meta,
  }),
);

export const esquemaCaidaTension = tabla(z.object({ caso: z.string(), maxPorcentaje: z.number().positive(), ...meta }));

export const esquemaResistividades = tabla(
  z.object({
    material: z.enum(["cobre", "aluminio"]),
    temperaturaC: z.number().nullable(),
    resistividadOhmMm2PorM: z.number().positive(),
    ...meta,
  }),
);

export const esquemaCoeficientesSimultaneidad = tabla(
  z.object({ tipoCircuito: tipoCircuito, factor: z.number().positive().max(1), ...meta }),
);

export const esquemaArtefactosTipicos = tabla(
  z.object({
    nombre: z.string(),
    potenciaW: z.number().positive(),
    cosFi: z.number().positive().max(1),
    requiereCircuitoPropio: z.boolean(),
    categoria: z.enum(["iluminacion", "toma", "fijo"]),
    ...meta,
  }),
);
