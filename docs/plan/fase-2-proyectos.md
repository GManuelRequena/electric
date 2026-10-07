# Fase 2: Proyectos con catálogo y circuitos según la norma

## Objetivo
Armar una vivienda completa desde el celular eligiendo elementos de un catálogo por ambiente. La app asigna los circuitos como pide la AEA 770, calcula cada uno con el motor de la Fase 1, valida contra la norma y dibuja el unifilar.

## Requisitos previos
- Fase 1 completa: `calcularCircuito`, `calcularVivienda`, UI base y PWA.
- Tablas `tipos-circuito`, `grados-electrificacion` y `bocas-minimas-ambiente` de la Fase 0.

## Alcance
- Modelo de datos del proyecto y su persistencia en IndexedDB.
- Editor de proyecto: ambientes → elementos → tablero.
- Asignación automática de circuitos, con la posibilidad de moverlos a mano.
- Validador con mensajes que citan la norma.
- Unifilar SVG generado automáticamente.
- Exportar e importar el proyecto en JSON (backup).

## Fuera de alcance
- Plano gráfico arrastrable (Fase 5).
- Presupuesto (Fase 3).
- IA (Fase 4).

## Modelo de datos

```ts
// src/dominio/proyecto/tipos.ts
export type TipoInmueble = "vivienda";            // escalable: "local" | "oficina" | ...
export type TipoAmbiente = "dormitorio" | "estar" | "comedor" | "cocina" | "bano" | "lavadero"
  | "pasillo" | "garage" | "exterior" | "otro";   // alinear con la tabla bocas-minimas-ambiente

export type TipoElemento =
  | "boca_luz" | "tecla_simple" | "tecla_doble" | "tecla_combinacion"
  | "toma_general" | "toma_especial" | "toma_exterior"
  | "artefacto";                                   // carga fija o enchufada

export interface Elemento {
  id: string;
  tipo: TipoElemento;
  ambienteId: string;
  artefacto?: Artefacto;            // si tipo === "artefacto" o un toma con carga conocida
  enchufadoEn?: string;             // id del toma, si es un artefacto enchufado
  comandaA?: string[];              // teclas → ids de boca_luz
  circuitoId?: string;              // asignado (auto o manual)
  asignacionManual?: boolean;
}

export interface Ambiente { id: string; nombre: string; tipo: TipoAmbiente; superficieM2?: number }

export interface Circuito {
  id: string;                       // "IUG1", "TUG2", "TUE1"
  tipo: TipoCircuito;
  largoM?: number;                  // manual
  largoEstimado?: boolean;          // true si se usó la estimación
  metodoInstalacion: string;
  resultado?: ResultadoCircuito;    // cache del cálculo
}

export interface Tablero {
  principal: { termicaA?: number; diferencialMa?: number };
  puestaATierra: boolean;
}

export interface Proyecto {
  id: string;
  nombre: string;
  tipoInmueble: TipoInmueble;
  norma: "aea770";                  // clave del módulo de norma
  superficieM2: number;
  sistema: Sistema;
  ambientes: Ambiente[];
  elementos: Elemento[];
  circuitos: Circuito[];
  tablero: Tablero;
  config: { metrosPorBoca: number; metrosHastaTablero: number }; // para estimar el largo
  creado: string; actualizado: string;
}
```

## Funciones de dominio

```ts
// src/dominio/circuitos/asignar.ts
export function asignarCircuitos(p: Proyecto, norma = aea770): Proyecto;
// Reglas (todas parametrizadas por la tabla tipos-circuito, sin números fijos en el código):
// - boca_luz → IUG; toma_general → TUG; toma_especial / artefacto con requiereCircuitoPropio → TUE/ACU según la tabla.
// - Iluminación y tomas generales nunca comparten circuito.
// - Si un circuito supera el máximo de bocas o de corriente → se abre uno nuevo del mismo tipo.
// - Se respetan los elementos con asignacionManual.
// - Se completan los circuitos mínimos que exige el grado de electrificación.

// src/dominio/circuitos/validar.ts
export interface Hallazgo {
  severidad: "error" | "advertencia" | "info";
  mensaje: string;                  // "Cocina: faltan 2 tomas para grado medio"
  ambienteId?: string; circuitoId?: string;
  fuente?: Fuente;
}
export function validarProyecto(p: Proyecto, norma = aea770): Hallazgo[];
// Chequea: grado de electrificación, circuitos mínimos, bocas mínimas por ambiente,
// máximo de bocas por circuito, Ib ≤ In ≤ Iz, sección mínima, caída de tensión, diferencial, PE.

// src/dominio/circuitos/largo.ts
export function estimarLargo(circuito: Circuito, p: Proyecto): number; // bocas × metrosPorBoca + metrosHastaTablero

// src/dominio/proyecto/unifilar.ts
export function modeloUnifilar(p: Proyecto): NodoUnifilar; // estructura pura; el SVG lo dibuja la UI
```

## Pantallas (mobile first)
1. **`/proyectos`**: lista de proyectos (tarjetas) y botón "+ Nuevo proyecto": nombre, superficie, sistema.
2. **`/proyectos/[id]`**, con pestañas abajo o arriba: **Ambientes · Circuitos · Tablero · Validación**.
   - **Ambientes**:
     - Lista de ambientes con un contador de elementos y ✓/⚠ según el mínimo de bocas.
     - "+ Ambiente".
     - Al tocar un ambiente: lista de sus elementos y "+" que abre una hoja inferior con la **grilla de íconos del catálogo** (luz, tecla simple/doble/combinación, toma general/especial/exterior, artefacto). Debe haber agregado rápido, por ejemplo "×3".
     - Al agregar una tecla: elegir qué luces comanda.
     - Al agregar un artefacto: elegir del catálogo de la Fase 1 y, si se enchufa, en qué toma.
   - **Circuitos**:
     - Tarjetas por circuito: tipo, cantidad de bocas, Ib, cable, térmica, ✓/⚠.
     - Largo editable, con la etiqueta "estimado" si no se cargó.
     - Mover elementos entre circuitos (selector "Mover a...", **no** drag & drop en móvil).
     - Botón "Reasignar automáticamente".
   - **Tablero**: unifilar SVG con zoom/pan táctil, y el resumen de protecciones.
   - **Validación**: hallazgos agrupados por severidad, cada uno con su cita y un link al ambiente o circuito.
3. Exportar e importar el proyecto en JSON desde el menú "⋯".

## Tareas
1. Tipos + persistencia (`src/integraciones/persistencia/proyectos.ts` con Dexie o idb).
2. `asignarCircuitos`, `estimarLargo`, `validarProyecto` y `modeloUnifilar`, con sus tests.
3. Componentes: `CatalogoElementos`, `TarjetaCircuito`, `ListaHallazgos`, `Unifilar` (SVG).
4. Pantallas de arriba.
5. Recalcular automáticamente al cambiar cualquier elemento (memoizado).
6. E2E: crear una vivienda de 2 ambientes (cocina + dormitorio), agregar elementos, ver los circuitos IUG/TUG separados y un hallazgo por falta de tomas.

## Tests obligatorios
- Luces y tomas generales quedan siempre en circuitos distintos.
- Superar el máximo de bocas (de la tabla) crea un segundo circuito.
- Un artefacto con `requiereCircuitoPropio` queda en su propio circuito especial.
- Las asignaciones manuales se respetan al reasignar.
- La validación detecta: bocas mínimas faltantes, circuitos mínimos por grado y Ib > In.
- `estimarLargo` usa la config y marca `largoEstimado`.
- Un proyecto de ejemplo del curso, si el usuario lo provee, da el mismo resultado que el apunte.

## Criterios de aceptación
- `npm run lint && npm test && npm run e2e && npm run build` en verde.
- Cargar una vivienda típica de 4 ambientes en el celular toma menos de 3 minutos.
- Funciona offline y los datos persisten al recargar.

## Preguntas abiertas
- ¿Qué ambientes y elementos usa más? ¿Falta algo en el catálogo (portero, timbre, TV/datos, bomba, calefón eléctrico)?
- Valores por defecto de `metrosPorBoca` y `metrosHastaTablero`.
- ¿Quiere símbolos IRAM específicos en el unifilar?

## Al terminar
Marcá la Fase 2 en `docs/plan/README.md`, hacé commit y push.
