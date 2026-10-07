import type { Fuente } from "../normas/tipos";

export type { Fuente };
export type Sistema = "monofasico" | "trifasico";
export type Material = "cobre" | "aluminio";
export type TipoCircuito = "IUG" | "TUG" | "IUE" | "TUE" | "ACU" | "MBTF" | "APM" | "ATE" | "MBTS" | "OCE";
export type Curva = "B" | "C" | "D";
export type CategoriaArtefacto = "iluminacion" | "toma" | "fijo";

export interface Artefacto {
  id: string;
  nombre: string;
  potenciaW?: number; // uno de los dos
  corrienteA?: number;
  cosPhi?: number; // default 1 para resistivos; editable
  cantidad: number;
  simultaneo: boolean; // si se usa a la vez con el resto
  requiereCircuitoPropio?: boolean;
  categoria?: CategoriaArtefacto;
}

export interface EntradaCircuito {
  sistema: Sistema;
  tensionV: number; // nominal: 220 V mono / 380 V tri; editable
  artefactos: Artefacto[];
  tipoCircuito?: TipoCircuito; // si no viene, se sugiere
  largoM?: number; // si falta, no se verifica la caída (avisar)
  metodoInstalacion: string; // clave de la tabla de corrientes admisibles
  material: Material;
  curva?: Curva; // si no viene, se sugiere
  reservaPct?: number; // reserva opcional sobre Ib (default 0)
  capacidadCorteKa?: number; // dato informativo de la protección
  tensionOrigenV?: number; // tensión medida en el origen (opcional)
}

export interface Paso {
  titulo: string;
  formula?: string;
  detalle: string;
  fuente?: Fuente;
  advertencia?: string;
}

export type MotivoSeccion = "minima_norma" | "corriente" | "caida_tension";

export interface ResultadoCircuito {
  potenciaTotalW: number;
  corrienteProyectoA: number; // Ib
  tipoCircuitoSugerido: TipoCircuito;
  artefactosConCircuitoPropio: string[];
  seccionMm2: number;
  motivoSeccion: MotivoSeccion;
  corrienteAdmisibleA: number; // Iz de la sección elegida
  termicaA: number; // In normalizado con Ib ≤ In ≤ Iz
  curva: Curva;
  capacidadCorteKa?: number;
  diferencial: { sensibilidadMa: number; obligatorio: boolean };
  caidaTensionPct?: number;
  caidaTensionV?: number;
  limiteCaidaPct?: number;
  tensionExtremoV?: number;
  cumple: boolean;
  pasos: Paso[];
  advertencias: string[]; // incluye valores con verificado:false
}

export class ErrorCalculo extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorCalculo";
  }
}
