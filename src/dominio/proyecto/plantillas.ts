import type { Sistema } from "../calculo/tipos";
import { nuevoId, proyectoNuevo, type Proyecto, type TipoAmbiente } from "./tipos";

/**
 * Plantillas de proyecto (fase 5.F). Solo traen ambientes con superficies de ejemplo para
 * arrancar más rápido: no son valores normativos. Las bocas y circuitos los asigna la norma
 * (`asignarCircuitos`) una vez que el usuario ajusta las medidas.
 */
export interface PlantillaAmbiente {
  nombre: string;
  tipo: TipoAmbiente;
  superficieM2?: number;
  largoM?: number;
}

export interface PlantillaProyecto {
  id: string;
  nombre: string;
  descripcion: string;
  ambientes: PlantillaAmbiente[];
}

export const PLANTILLAS: PlantillaProyecto[] = [
  {
    id: "monoambiente",
    nombre: "Monoambiente",
    descripcion: "Un ambiente principal, cocina y baño.",
    ambientes: [
      { nombre: "Estar / dormitorio", tipo: "estar-comedor", superficieM2: 20 },
      { nombre: "Cocina", tipo: "cocina", superficieM2: 6 },
      { nombre: "Baño", tipo: "bano", superficieM2: 4 },
    ],
  },
  {
    id: "casa-2-dormitorios",
    nombre: "Casa de 2 dormitorios",
    descripcion: "Estar-comedor, cocina, 2 dormitorios, baño, lavadero y pasillo.",
    ambientes: [
      { nombre: "Estar / comedor", tipo: "estar-comedor", superficieM2: 22 },
      { nombre: "Cocina", tipo: "cocina", superficieM2: 9 },
      { nombre: "Dormitorio 1", tipo: "dormitorio", superficieM2: 12 },
      { nombre: "Dormitorio 2", tipo: "dormitorio", superficieM2: 10 },
      { nombre: "Baño", tipo: "bano", superficieM2: 5 },
      { nombre: "Lavadero", tipo: "lavadero", superficieM2: 5 },
      { nombre: "Pasillo", tipo: "pasillo", superficieM2: 5, largoM: 5 },
    ],
  },
];

export function superficiePlantilla(p: PlantillaProyecto): number {
  return p.ambientes.reduce((s, a) => s + (a.superficieM2 ?? 0), 0);
}

export function proyectoDesdePlantilla(
  plantilla: PlantillaProyecto,
  datos: { nombre: string; superficieM2: number; sistema: Sistema },
  ahora = new Date().toISOString(),
): Proyecto {
  const base = proyectoNuevo(datos, ahora);
  return { ...base, ambientes: plantilla.ambientes.map((a) => ({ ...a, id: nuevoId() })) };
}
