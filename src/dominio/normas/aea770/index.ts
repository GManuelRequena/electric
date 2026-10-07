import tiposCircuitoJson from "./tipos-circuito.json";
import gradosJson from "./grados-electrificacion.json";
import bocasJson from "./bocas-minimas-ambiente.json";
import seccionesJson from "./secciones-minimas.json";
import corrientesJson from "./corrientes-admisibles.json";
import factoresJson from "./factores-agrupamiento.json";
import calibresMaxJson from "./calibres-max-proteccion.json";
import calibresJson from "./calibres-normalizados.json";
import curvasJson from "./curvas-disparo.json";
import diferencialesJson from "./diferenciales.json";
import caidaJson from "./caida-tension.json";
import resistividadesJson from "./resistividades.json";
import simultaneidadJson from "./coeficientes-simultaneidad.json";
import artefactosJson from "./artefactos-tipicos.json";
import {
  esquemaArtefactosTipicos,
  esquemaBocasMinimasAmbiente,
  esquemaCaidaTension,
  esquemaCalibresMaxProteccion,
  esquemaCalibresNormalizados,
  esquemaCoeficientesSimultaneidad,
  esquemaCorrientesAdmisibles,
  esquemaCurvasDisparo,
  esquemaDiferenciales,
  esquemaFactoresAgrupamiento,
  esquemaGradosElectrificacion,
  esquemaResistividades,
  esquemaSeccionesMinimas,
  esquemaTiposCircuito,
} from "./esquemas";

/** Tablas de AEA 90364-7-770 ya validadas contra su esquema. */
export const aea770 = {
  tiposCircuito: esquemaTiposCircuito.parse(tiposCircuitoJson),
  gradosElectrificacion: esquemaGradosElectrificacion.parse(gradosJson),
  bocasMinimasAmbiente: esquemaBocasMinimasAmbiente.parse(bocasJson),
  seccionesMinimas: esquemaSeccionesMinimas.parse(seccionesJson),
  corrientesAdmisibles: esquemaCorrientesAdmisibles.parse(corrientesJson),
  factoresAgrupamiento: esquemaFactoresAgrupamiento.parse(factoresJson),
  calibresMaxProteccion: esquemaCalibresMaxProteccion.parse(calibresMaxJson),
  calibresNormalizados: esquemaCalibresNormalizados.parse(calibresJson),
  curvasDisparo: esquemaCurvasDisparo.parse(curvasJson),
  diferenciales: esquemaDiferenciales.parse(diferencialesJson),
  caidaTension: esquemaCaidaTension.parse(caidaJson),
  resistividades: esquemaResistividades.parse(resistividadesJson),
  coeficientesSimultaneidad: esquemaCoeficientesSimultaneidad.parse(simultaneidadJson),
  artefactosTipicos: esquemaArtefactosTipicos.parse(artefactosJson),
} as const;

export type TablasAea770 = typeof aea770;
