import type { Artefacto, ResultadoCircuito, Sistema, TipoCircuito } from "../calculo/tipos";

export type TipoInmueble = "vivienda"; // escalable: "local" | "oficina" | ...

/** Las claves coinciden con `ambiente` de la tabla bocas-minimas-ambiente. */
export type TipoAmbiente =
  | "dormitorio"
  | "estar-comedor"
  | "cocina"
  | "bano"
  | "lavadero"
  | "pasillo"
  | "vestibulo"
  | "garage"
  | "exterior"
  | "otro";

export type TipoElemento =
  | "boca_luz"
  | "tecla_simple"
  | "tecla_doble"
  | "tecla_combinacion"
  | "toma_general"
  | "toma_especial"
  | "toma_exterior"
  | "artefacto"; // carga fija o enchufada

export interface Elemento {
  id: string;
  tipo: TipoElemento;
  ambienteId: string;
  artefacto?: Artefacto; // si tipo === "artefacto"
  enchufadoEn?: string; // id del toma, si es un artefacto enchufado
  comandaA?: string[]; // teclas → ids de boca_luz
  circuitoId?: string; // asignado (auto o manual)
  asignacionManual?: boolean;
}

export interface Ambiente {
  id: string;
  nombre: string;
  tipo: TipoAmbiente;
  superficieM2?: number;
  largoM?: number; // pasillos: la norma pide 1 boca cada 5 m
}

export interface Circuito {
  id: string; // "IUG1", "TUG2", "TUE1"
  tipo: TipoCircuito;
  largoM?: number; // manual
  largoEstimado?: boolean; // true si se usó la estimación
  largoDesdePlano?: boolean; // true si el largo salió del plano (recorrido ortogonal)
  metodoInstalacion: string;
  resultado?: ResultadoCircuito; // cache del cálculo
  error?: string; // por qué no se pudo calcular
}

export interface Tablero {
  principal: { termicaA?: number; diferencialMa?: number };
  puestaATierra: boolean;
}

/** Punto del plano en metros (x hacia la derecha, y hacia abajo). */
export interface Punto {
  x: number;
  y: number;
}

/** Ambiente dibujado como rectángulo; (x, y) es la esquina superior izquierda. */
export interface RectAmbiente extends Punto {
  ambienteId: string;
  anchoM: number;
  altoM: number;
}

/** Plano en planta del proyecto (Fase 5.A). Todo en metros. */
export interface Plano {
  ambientes: RectAmbiente[];
  posiciones: Record<string, Punto>; // id de elemento → posición
  tablero?: Punto;
}

/** Alturas de montaje en metros: parámetros de la app (no vienen de la norma), editables por proyecto. */
export interface AlturasMontaje {
  tableroM: number;
  techoM: number; // bocas de luz y artefactos fijos
  tomaM: number; // tomacorrientes
}

export const ALTURAS_POR_DEFECTO: AlturasMontaje = { tableroM: 1.5, techoM: 2.6, tomaM: 0.3 };

export interface ConfigProyecto {
  metrosPorBoca: number; // para estimar el largo
  metrosHastaTablero: number;
  tensionV?: number; // de los circuitos terminales; por defecto 220 V
  metodoInstalacion?: string; // por defecto para circuitos nuevos
  alturas?: AlturasMontaje; // para el largo desde plano
}

export interface Proyecto {
  id: string;
  nombre: string;
  tipoInmueble: TipoInmueble;
  norma: "aea770"; // clave del módulo de norma
  superficieM2: number;
  superficieSemicubiertaM2?: number;
  sistema: Sistema; // de la acometida; los circuitos terminales se calculan monofásicos
  ambientes: Ambiente[];
  elementos: Elemento[];
  circuitos: Circuito[];
  tablero: Tablero;
  config: ConfigProyecto;
  plano?: Plano;
  creado: string;
  actualizado: string;
}

export const TENSION_MONOFASICA_V = 220;
export const CONFIG_POR_DEFECTO = { metrosPorBoca: 4, metrosHastaTablero: 5 } as const;

export const NOMBRES_AMBIENTE: Record<TipoAmbiente, string> = {
  dormitorio: "Dormitorio",
  "estar-comedor": "Estar / comedor",
  cocina: "Cocina",
  bano: "Baño",
  lavadero: "Lavadero",
  pasillo: "Pasillo",
  vestibulo: "Vestíbulo",
  garage: "Garage",
  exterior: "Exterior",
  otro: "Otro",
};

export const NOMBRES_ELEMENTO: Record<TipoElemento, string> = {
  boca_luz: "Boca de luz",
  tecla_simple: "Tecla simple",
  tecla_doble: "Tecla doble",
  tecla_combinacion: "Tecla combinación",
  toma_general: "Toma general",
  toma_especial: "Toma especial",
  toma_exterior: "Toma exterior",
  artefacto: "Artefacto",
};

export const ES_TECLA = (t: TipoElemento) => t === "tecla_simple" || t === "tecla_doble" || t === "tecla_combinacion";
export const ES_TOMA = (t: TipoElemento) => t === "toma_general" || t === "toma_especial" || t === "toma_exterior";

/** Id corto para elementos, ambientes y circuitos manuales. */
export function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function proyectoNuevo(datos: { nombre: string; superficieM2: number; sistema: Sistema; metodoInstalacion?: string }, ahora = new Date().toISOString()): Proyecto {
  return {
    id: nuevoId(),
    nombre: datos.nombre,
    tipoInmueble: "vivienda",
    norma: "aea770",
    superficieM2: datos.superficieM2,
    sistema: datos.sistema,
    ambientes: [],
    elementos: [],
    circuitos: [],
    tablero: { principal: { diferencialMa: 30 }, puestaATierra: true },
    config: { ...CONFIG_POR_DEFECTO, metodoInstalacion: datos.metodoInstalacion },
    creado: ahora,
    actualizado: ahora,
  };
}
