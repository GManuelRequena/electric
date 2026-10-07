import type { Precio } from "@/dominio/computo/presupuesto";

export type { Precio };

export interface PriceProvider {
  id: string;
  nombre: string;
  /** Devuelve los precios que conoce; los códigos sin precio simplemente no están en el mapa. */
  obtenerPrecios(codigos: string[]): Promise<Map<string, Precio>>;
}

/**
 * Ejemplo para probar la interfaz sin red: precios fijos y ficticios.
 * Un proveedor real (API o scraping + mapeo de códigos) implementaría esta misma interfaz.
 */
export class MockPriceProvider implements PriceProvider {
  id = "mock";
  nombre = "Proveedor de ejemplo (ficticio)";
  constructor(private tabla: Record<string, number> = {}) {}
  async obtenerPrecios(codigos: string[]): Promise<Map<string, Precio>> {
    const m = new Map<string, Precio>();
    for (const codigo of codigos) {
      const precioUnitario = this.tabla[codigo];
      if (precioUnitario != null) m.set(codigo, { codigo, precioUnitario, moneda: "ARS", fecha: "2026-01-01", proveedor: this.nombre });
    }
    return m;
  }
}
