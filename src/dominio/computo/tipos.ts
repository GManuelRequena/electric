export type UnidadMaterial = "m" | "u" | "rollo";
export type CategoriaMaterial = "conductores" | "canalizaciones" | "cajas" | "mecanismos" | "protecciones" | "tablero" | "puesta_a_tierra" | "varios";

export interface ItemMaterial {
  /** Interno y estable: "CABLE_UNI_2.5_CU_CELESTE". */
  codigo: string;
  /** "Cable unipolar 2,5 mm² Cu (IRAM NM 247-3), celeste". */
  descripcion: string;
  unidad: UnidadMaterial;
  categoria: CategoriaMaterial;
  /** Por ejemplo, rollo de 100 m. Es solo informativo: el precio es por `unidad`. */
  presentacion?: { unidad: "rollo"; cantidad: number };
}

export interface LineaComputo {
  codigo: string;
  cantidad: number;
  /** Ids de circuito o de elemento que la generan (trazabilidad). */
  origen: string[];
  /** Depende de un largo estimado o de un criterio de la app, no de un dato cargado. */
  estimado: boolean;
}

export type ColorConductor = "marron" | "negro" | "rojo" | "celeste" | "verde_amarillo";

export interface ConfigComputo {
  desperdicioPct: number;
  coloresPorFuncion: { fase: ColorConductor; neutro: ColorConductor; pe: ColorConductor };
  /** Código del caño que se usa en todos los circuitos. */
  canalizacionPorDefecto: string;
  /** Se estima una caja de paso cada tantas bocas de un circuito (criterio de la app, no de la norma). */
  bocasPorCajaDePaso: number;
  /** Reserva de módulos libres en el gabinete. */
  reservaTableroPct: number;
  /** Sección del cable de la jabalina al tablero (criterio de la app, `verificado: false`). */
  seccionBajadaPatMm2: number;
}

export const CONFIG_COMPUTO_POR_DEFECTO: ConfigComputo = {
  desperdicioPct: 10,
  coloresPorFuncion: { fase: "marron", neutro: "celeste", pe: "verde_amarillo" },
  canalizacionPorDefecto: "CANO_CORRUGADO_20",
  bocasPorCajaDePaso: 5,
  reservaTableroPct: 20,
  seccionBajadaPatMm2: 6,
};

export const NOMBRES_CATEGORIA: Record<CategoriaMaterial, string> = {
  conductores: "Conductores",
  canalizaciones: "Canalizaciones",
  cajas: "Cajas",
  mecanismos: "Mecanismos",
  protecciones: "Protecciones",
  tablero: "Tablero",
  puesta_a_tierra: "Puesta a tierra",
  varios: "Varios",
};
