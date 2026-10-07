# Fase 1: Calculadoras + PWA

## Objetivo
Primera versión usable en el celular: tres calculadoras deterministas que muestran el paso a paso y las citas, instalable como PWA y funcionando sin conexión, con un botón para consultar en NotebookLM.

## Requisitos previos
- Fase 0 hecha, o al menos las tablas `tipos-circuito`, `corrientes-admisibles`, `calibres-normalizados`, `secciones-minimas`, `caida-tension` y `artefactos-tipicos` cargadas (aunque tengan `verificado: false`).

## Alcance
- Scaffold Next.js + TS strict + Tailwind + Vitest + Playwright + ESLint.
- PWA: manifest, íconos, service worker (por ejemplo `@serwist/next`) con cache offline de todas las rutas de las calculadoras.
- Layout mobile first con navegación inferior: **Calcular · Proyectos · Presupuesto · Consultar**. Proyectos y Presupuesto quedan como "Próximamente".
- Motor de cálculo en `src/dominio/calculo/`.
- Tres calculadoras + el botón de NotebookLM.
- Persistir en `localStorage` o IndexedDB los últimos cálculos y los artefactos personalizados del usuario.

## Fuera de alcance
- Proyectos completos (Fase 2).
- Presupuesto (Fase 3).
- IA (Fase 4).
- Login.

## Modelo de datos y firmas

```ts
// src/dominio/calculo/tipos.ts
export type Sistema = "monofasico" | "trifasico";
export type TipoCircuito = "IUG" | "TUG" | "IUE" | "TUE" | "ACU" | "MBTF" | "OCE" | string; // según la tabla de la Fase 0

export interface Artefacto {
  id: string;
  nombre: string;
  potenciaW?: number;        // uno de los dos
  corrienteA?: number;
  cosPhi?: number;           // default 1 para resistivos; editable
  cantidad: number;
  simultaneo: boolean;       // si se usa a la vez con el resto
  requiereCircuitoPropio?: boolean;
}

export interface EntradaCircuito {
  sistema: Sistema;
  tensionV: number;          // de la Fase 0 (pregunta abierta: 220/230)
  artefactos: Artefacto[];
  tipoCircuito?: TipoCircuito; // si no viene, se sugiere
  largoM?: number;           // si falta, no se verifica la caída (avisar)
  metodoInstalacion: string; // clave de la tabla de corrientes admisibles
  material: "cobre" | "aluminio";
}

export interface Paso {               // para mostrar el paso a paso
  titulo: string;                     // "Corriente de proyecto"
  formula?: string;                   // "Ib = P / (U · cos φ)"
  detalle: string;                    // "3500 / (220 · 1) = 15,9 A"
  fuente?: Fuente;                    // cita cuando aplica un valor de la norma
  advertencia?: string;               // por ejemplo "valor sin verificar"
}

export interface ResultadoCircuito {
  potenciaTotalW: number;
  corrienteProyectoA: number;         // Ib
  tipoCircuitoSugerido: TipoCircuito;
  artefactosConCircuitoPropio: string[];  // ids que deberían ir aparte
  seccionMm2: number;                 // max(mínima norma, por Iz, por caída)
  motivoSeccion: "minima_norma" | "corriente" | "caida_tension";
  corrienteAdmisibleA: number;        // Iz de la sección elegida
  termicaA: number;                   // In normalizado con Ib ≤ In ≤ Iz
  curva: "B" | "C" | "D";
  diferencial: { sensibilidadMa: number; obligatorio: boolean };
  caidaTensionPct?: number;
  cumple: boolean;
  pasos: Paso[];
  advertencias: string[];             // incluye valores con verificado:false
}

export function calcularCircuito(e: EntradaCircuito, norma = aea770): ResultadoCircuito;
export function corrienteDesdePotencia(potenciaW: number, tensionV: number, cosPhi: number, sistema: Sistema): number;
export function caidaTension(/* corriente, largo, sección, material, sistema, cosPhi */): { volts: number; pct: number };
export function elegirSeccion(/* ... */): { seccionMm2: number; motivo: ...; pasos: Paso[] };
export function elegirTermica(ib: number, iz: number, norma): { inA: number; pasos: Paso[] } | { error: string };

// src/dominio/calculo/vivienda.ts
export interface EntradaVivienda { superficieM2: number; ambientes: { tipo: string; cantidad: number }[] }
export interface ResultadoVivienda {
  grado: "minimo" | "medio" | "elevado" | "superior";
  circuitosMinimos: { tipo: TipoCircuito; cantidad: number }[];
  bocasPorAmbiente: { tipo: string; iluminacion: number; tomas: number; especiales: number }[];
  pasos: Paso[];
}
export function calcularVivienda(e: EntradaVivienda, norma = aea770): ResultadoVivienda;
```

Las fórmulas (corriente mono y trifásica, caída de tensión) tienen que coincidir con las del curso (Módulos 2 a 5). Citá el módulo en el `Paso`.

## Tareas
1. Scaffold del proyecto (si la Fase 0 no lo hizo), scripts `dev/test/lint/e2e/build` y `tsconfig` con `strict: true`.
2. Implementar `src/dominio/calculo/*` con sus tests.
3. Componentes UI base en `src/componentes/`:
   - `CampoNumero` (con unidad e `inputMode="decimal"`),
   - `Selector`,
   - `TarjetaResultado`,
   - `PasoAPaso` (acordeón),
   - `Cita`,
   - `AvisoNoVerificado`,
   - `NavInferior`,
   - `AvisoLegal`.
4. **Pantalla `/calcular`**: un menú con tres tarjetas grandes.
5. **`/calcular/artefactos`** (la principal):
   - Arriba: sistema (mono/tri), largo del circuito (opcional) y método de instalación. Se pueden contraer en "Opciones".
   - Lista de artefactos agregados (nombre, W o A, cantidad, quitar).
   - Botón grande "+ Agregar artefacto" → hoja inferior (bottom sheet) con un buscador sobre `artefactos-tipicos` y la opción "Personalizado" (nombre, W **o** A con toggle, cos φ, cantidad, simultáneo).
   - El resultado se muestra en vivo, fijo abajo: "Cable 2,5 mm² · Térmica 16 A C · Diferencial 30 mA", con un ✓ o ⚠.
   - Debajo: "Ver cálculo paso a paso" con las citas y las advertencias (circuito propio, valores sin verificar, caída no verificada por falta de largo).
6. **`/calcular/rapida`**: un circuito con potencia o corriente directa. Usa el mismo `calcularCircuito` con un solo artefacto.
6b. **`/calcular/caida-tension`** (calculadora dedicada a distancia y sección):
   - **Entradas**:
     - sistema (mono/tri),
     - tensión,
     - corriente **o** potencia + cos φ,
     - largo del tramo (m),
     - material,
     - sección (opcional),
     - límite de caída por tipo de tramo (de `caida-tension.json`; editable con un aviso si se aparta de la norma).
   - **Modos**:
     1. **Verificar**: con una sección dada → caída en V y %, tensión en el extremo y ✓/⚠ contra el límite.
     2. **Sección mínima**: sin sección → recorre las secciones normalizadas y devuelve la menor que cumple (y además cumple Iz ≥ In y la sección mínima de la norma).
     3. **Largo máximo**: con la sección dada → distancia máxima admisible para esa carga.
   - **Tabla comparativa**: todas las secciones normalizadas con su caída % para el largo ingresado, resaltando la primera que cumple. Es lo más útil en obra.
   - **Varios tramos** (opcional): línea principal + seccional + terminal, verificando la caída acumulada contra el límite total.
   - Paso a paso con la fórmula usada (la del curso) y la cita del límite.
   - Funciones de dominio: `caidaTension`, `seccionMinimaPorCaida`, `largoMaximo` y `tablaCaidaPorSeccion` en `src/dominio/calculo/caida.ts`, con sus tests.
7. **`/calcular/vivienda`**: superficie + cantidad de ambientes por tipo → grado de electrificación, circuitos mínimos y tabla de bocas por ambiente.
8. **Consultar (`/consultar`)** y el botón "Consultar en NotebookLM" en cada resultado:
   - Arma un texto con el contexto del cálculo y la pregunta.
   - Lo copia al portapapeles (`navigator.clipboard`).
   - Abre la URL del notebook del usuario en una pestaña nueva.
   - La URL es configurable en `/ajustes` (guardada local).
   - Interfaz `AsistenteNorma` en `src/integraciones/consulta/` con la implementación `NotebookLmLink`.
9. **`/ajustes`**:
   - tensión por defecto,
   - URL de NotebookLM,
   - material por defecto,
   - % de reserva de la térmica (si aplica),
   - borrar datos locales.
10. PWA: manifest (nombre "Electricista", `theme_color`, íconos 192/512), service worker y prueba offline.
11. E2E Playwright en 390×844: agregar 3 artefactos → ver el resultado → abrir el paso a paso. Repetirlo en desktop.

## Tests obligatorios (Vitest)
- `corrienteDesdePotencia`: monofásico y trifásico, con valores calculados a mano en el test.
- `elegirTermica`: elige el menor In normalizado ≥ Ib, y devuelve error si no existe ninguno ≤ Iz.
- `elegirSeccion`: los tres motivos (mínima de la norma, por corriente, por caída de tensión) con casos que fuercen cada uno.
- `calcularCircuito`: marca `artefactosConCircuitoPropio` cuando corresponde, y propaga advertencias de valores `verificado: false`.
- **Ejercicios del curso**: por cada ejercicio resuelto de los Módulos 2 a 5 que te pase el usuario, un test con el enunciado como comentario y el resultado esperado. **Este es el criterio de aceptación principal.**

## Criterios de aceptación
- `npm run lint && npm test && npm run e2e && npm run build` en verde.
- Lighthouse PWA "installable". Con el modo avión activado, `/calcular/*` funciona.
- En 390×844 no hay scroll horizontal y los botones miden ≥ 44px.
- Cada número normativo en pantalla tiene su cita.

## Ideas tomadas de la app de referencia
Ver `docs/plan/referencia-calculadora-pro.md`. En esta fase se incorporan:
- **Semáforo de caída de tensión** (verde / ámbar / rojo) con los límites de `caida-tension.json` según el tipo de tramo, no con 3% / 5% fijos.
- **Autoajuste de la sección**: si la caída no cumple, el resultado propone la sección que cumple y muestra "con X mm² la caída sería Y%".
- **Curva B / C / D sugerida** según el tipo de carga (resistiva/iluminación, general, motores). La regla sale del curso o la norma y se puede cambiar a mano.
- **Capacidad de corte (kA)** de la térmica como dato configurable (por defecto desde `/ajustes`).
- **Reserva opcional** (%) sobre Ib, desactivada por defecto. No usar el "FS 1.25" de la NEC como criterio de la AEA.
- **Duplicar circuito** (en la calculadora por artefactos) para cargar rápido circuitos parecidos.
- Fórmula de caída **con la sección, la resistividad y el cos φ** de cada artefacto (la referencia tiene errores en esto, no copiarla).

## Datos ya provistos por el usuario
- URL del notebook de NotebookLM: `https://notebook.google.com/notebook/3542ef10-60ec-40f0-9614-6ba471b40320/preview`. Usarla como valor por defecto en `/ajustes` (editable). Ojo: el dominio habitual es `notebooklm.google.com`; si el link no abre, confirmarlo con el usuario.

## Preguntas abiertas
- Lista de artefactos típicos y sus potencias según el curso. ¿Algún valor personalizado?
- Métodos de instalación más comunes en su práctica (para ponerlos primero).
- ¿Curva de térmica por defecto: C?
- Ejercicios resueltos para los tests (páginas de los módulos).

## Al terminar
Marcá la Fase 1 en `docs/plan/README.md`, hacé commit y push. Opcional: deploy en Vercel y pasarle el link al usuario.
