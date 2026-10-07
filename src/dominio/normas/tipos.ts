export interface Fuente {
  norma: string; // "AEA 90364-7-770"
  edicion: string; // "2017"
  referencia: string; // "Tabla 770.12.I" o "Art. 770.7.2"
  documento: string; // "MODULO_6.pdf"
  pagina?: number;
}

export interface ValorNormativo<T> {
  valor: T;
  unidad?: string;
  fuente: Fuente;
  verificado: boolean; // true solo si el usuario lo confirmó contra el PDF
  nota?: string; // "PENDIENTE_VERIFICAR: ..." cuando corresponda
}

export interface TablaNorma<Fila> {
  id: string; // "aea770.tiposCircuito"
  titulo: string;
  fuente: Fuente;
  verificado: boolean;
  nota?: string;
  filas: Fila[];
}

/** Metadatos que lleva cada fila de una tabla normativa. */
export interface FilaNormativa {
  fuente: Fuente;
  verificado: boolean;
  nota?: string;
}
