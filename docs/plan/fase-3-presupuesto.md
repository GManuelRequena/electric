# Fase 3: Presupuesto de materiales

## Objetivo
A partir de un proyecto de la Fase 2, generar automáticamente el **cómputo de materiales**, aplicarle precios (manuales o importados), sumar la mano de obra y exportar un presupuesto. Los precios quedan detrás de una interfaz `PriceProvider`, para poder conectar proveedores más adelante.

## Requisitos previos
- Fase 2 completa: `Proyecto` con circuitos calculados.

## Alcance
- Catálogo genérico de materiales.
- `calcularComputo(proyecto)` determinista.
- `PriceProvider` + `ManualPriceProvider` (carga a mano o importación CSV/XLSX).
- Mano de obra por boca, por hora o con un monto fijo.
- Pantalla de presupuesto y exportación en PDF y XLSX.

## Fuera de alcance
- Integración real con un proveedor (se deja la interfaz y un ejemplo mock).
- Facturación.

## Modelo de datos y firmas

```ts
// src/dominio/computo/tipos.ts
export interface ItemMaterial {
  codigo: string;              // interno y estable: "CABLE_UNI_2.5_CU"
  descripcion: string;         // "Cable unipolar 2,5 mm² Cu (IRAM NM 247-3)"
  unidad: "m" | "u" | "rollo";
  categoria: "conductores" | "canalizaciones" | "cajas" | "mecanismos" | "protecciones" | "tablero" | "puesta_a_tierra" | "varios";
  presentacion?: { unidad: "rollo"; cantidad: number }; // por ejemplo rollo de 100 m
}

export interface LineaComputo {
  codigo: string;
  cantidad: number;
  origen: string[];            // ids de circuito/elemento que la generan (trazabilidad)
  estimado: boolean;           // si depende de un largo estimado
}

export interface ConfigComputo {
  desperdicioPct: number;      // por ejemplo 10
  coloresPorFuncion: { fase: string; neutro: string; pe: string };
  canalizacionPorDefecto: string;
}

export function calcularComputo(p: Proyecto, cfg: ConfigComputo): LineaComputo[];
// Reglas:
// - Conductores: por circuito, largo × (fases + neutro + PE) × (1 + desperdicio), por sección y color.
// - Cajas: una por boca / toma / tecla según el tipo (rectangular, octogonal, mignon) + cajas de paso estimadas.
// - Mecanismos: módulos de tecla y toma, bastidores y tapas.
// - Protecciones: una térmica por circuito, diferencial(es), principal.
// - Tablero: gabinete con cantidad de módulos DIN = suma + reserva.
// - Puesta a tierra: jabalina, cable PE, caja de inspección.

// src/integraciones/precios/PriceProvider.ts
export interface Precio { codigo: string; precioUnitario: number; moneda: "ARS" | "USD"; fecha: string; proveedor: string; url?: string }
export interface PriceProvider {
  id: string;
  nombre: string;
  obtenerPrecios(codigos: string[]): Promise<Map<string, Precio>>;
}
export class ManualPriceProvider implements PriceProvider { /* IndexedDB; import CSV/XLSX */ }
// Futuro: class ProveedorXPriceProvider implements PriceProvider { /* API o scraping + mapeo de códigos */ }

// src/dominio/computo/presupuesto.ts
export interface ManoDeObra { modo: "por_boca" | "por_hora" | "fijo"; valor: number; horas?: number }
export interface Presupuesto {
  lineas: (LineaComputo & { precio?: Precio; subtotal?: number })[];
  sinPrecio: string[];
  materiales: number; manoDeObra: number; total: number;
}
export function armarPresupuesto(c: LineaComputo[], precios: Map<string, Precio>, mo: ManoDeObra, p: Proyecto): Presupuesto;
```

## Datos
- `src/dominio/computo/materiales.json`: catálogo genérico inicial. Los nombres y presentaciones se le preguntan al usuario o se toman del Módulo 3 (materiales).

## Pantallas
1. **`/presupuesto`**: elegir un proyecto.
2. **`/presupuesto/[proyectoId]`**:
   - Acordeón por categoría con cantidad, precio unitario editable inline y subtotal.
   - Etiqueta "estimado" en las líneas que dependen de largos estimados.
   - Banner con "N ítems sin precio".
   - Bloque de mano de obra (modo + valor).
   - Total fijo abajo.
   - Botones: **Exportar PDF**, **Exportar Excel**, **Compartir** (Web Share API en el celular).
3. **`/ajustes/precios`**:
   - lista de precios cargados,
   - importar CSV/XLSX (columnas `codigo, precio, moneda, fecha, proveedor`),
   - plantilla descargable,
   - fecha de la última actualización.

## Tareas
1. Catálogo de materiales + `calcularComputo` con tests.
2. `PriceProvider`, `ManualPriceProvider` e importador CSV/XLSX (por ejemplo `papaparse` / `xlsx`).
3. `armarPresupuesto` con sus tests.
4. Pantallas.
5. Exportación: PDF (por ejemplo `@react-pdf/renderer` o una vista imprimible) y XLSX.
6. E2E: proyecto de ejemplo → presupuesto → cargar 2 precios → el total se actualiza → exportar.

## Tests obligatorios
- Un circuito monofásico de 10 m con PE y 10% de desperdicio da 3 × 10 × 1,1 = 33 m del conductor de esa sección.
- La cantidad de térmicas es igual a la cantidad de circuitos.
- Los módulos DIN del gabinete son ≥ la suma de las protecciones.
- Las líneas sin precio aparecen en `sinPrecio` y no rompen el total.
- El importador CSV rechaza filas inválidas y reporta cuáles.

## Criterios de aceptación
- `npm run lint && npm test && npm run e2e && npm run build` en verde.
- Se puede exportar y compartir el PDF desde el celular.
- Cada línea del cómputo se puede rastrear hasta los circuitos o elementos que la generan.

## Preguntas abiertas
- ¿Proveedor(es) habituales? ¿Tienen una lista de precios descargable o un sitio con API?
- Marcas y presentaciones preferidas (rollo de 100 m, etc.).
- ¿Cómo cobra la mano de obra (por boca, por día, fijo)?
- ¿Moneda: ARS solamente? ¿Hace falta ajustar por fecha (inflación)?

## Al terminar
Marcá la Fase 3 en `docs/plan/README.md`, hacé commit y push.
