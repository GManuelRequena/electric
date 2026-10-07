# Fase 0: Corpus y tablas de la norma

## Objetivo
Transcribir a JSON tipado las tablas de la AEA 90364 (sección 770, viviendas) que necesita el motor de cálculo, cada valor con su cita, y dejar un loader tipado para usarlas desde `src/dominio/`.

## Requisitos previos
- Acceso a los PDFs. Están en Google Drive, carpeta `11vFi1ma2vcENBdrFtXfNHp79D5JUeELO`:
  - `MODULO_1_EI_1.pdf` a `MODULO_5_EI.pdf`: texto digital (teoría, materiales, cálculos).
  - `MODULO_6.pdf`: **reglamentación AEA 90364 escaneada**. Usar este. (`MODULO_6_1.pdf` es un duplicado confirmado por el usuario: ignorarlo.)
  - `MODULO_7.pdf`.
- Si el agente no tiene acceso a Drive, tiene que pedirle al usuario que copie los PDFs en `material/` (carpeta en `.gitignore`) o que dicte o fotografíe las tablas.

## Alcance
- Crear el proyecto mínimo para alojar los datos: `package.json`, TypeScript, Vitest y `.gitignore` con `material/`, `*.pdf`, `node_modules`, `.next`. Si la Fase 1 ya inicializó Next.js, reutilizarlo.
- Definir los tipos de las tablas y los loaders.
- Transcribir las tablas listadas abajo.
- Validar los JSON con un test de esquema (por ejemplo `zod`).

## Fuera de alcance
- UI.
- OCR completo del Módulo 6.
- Subir texto de la norma al repo.

## Modelo de datos

```ts
// src/dominio/normas/tipos.ts
export interface Fuente {
  norma: string;          // "AEA 90364-7-770"
  edicion: string;        // "2017" (edición confirmada por el usuario)
  referencia: string;     // "Tabla 770.12.I" o "Art. 770.7.2"
  documento: string;      // "MODULO_6.pdf"
  pagina?: number;
}

export interface ValorNormativo<T> {
  valor: T;
  unidad?: string;
  fuente: Fuente;
  verificado: boolean;    // true solo si el usuario lo confirmó contra el PDF
  nota?: string;          // "PENDIENTE_VERIFICAR: ..." cuando corresponda
}

export interface TablaNorma<Fila> {
  id: string;             // "aea770.tiposCircuito"
  titulo: string;
  fuente: Fuente;
  verificado: boolean;
  filas: Fila[];
}
```

## Tablas a transcribir (`src/dominio/normas/aea770/*.json`)

Por cada tabla: buscá en el Módulo 6 (o en los Módulos 1 a 5 si la reproducen), transcribí, completá `fuente` y dejá `verificado: false` hasta que el usuario confirme.

1. `tipos-circuito.json`: tipo (IUG, TUG, IUE, TUE, ACU, MBTF, OCE...) → máximo de bocas, calibre máximo de protección, sección mínima, si admite otros consumos.
2. `grados-electrificacion.json`: grado → rango de superficie y/o demanda, número mínimo de circuitos y composición mínima.
3. `bocas-minimas-ambiente.json`: ambiente (dormitorio, estar, comedor, cocina, baño, lavadero, pasillo, garage, exterior...) × grado → bocas mínimas de iluminación, tomas generales y tomas especiales.
4. `secciones-minimas.json`: tipo de circuito / uso (línea principal, seccional, circuitos terminales, PE) → sección mínima (mm²).
5. `corrientes-admisibles.json`: método de instalación (en cañería embutida, a la vista, bandeja...) × material × cantidad de conductores cargados × sección → Iz (A). Incluir los factores de corrección por temperatura y agrupamiento si la norma los trae.
6. `calibres-normalizados.json`: In normalizados de PIA/térmicas (A) y curvas disponibles (B, C, D).
7. `diferenciales.json`: sensibilidades (mA) y dónde son obligatorios.
8. `caida-tension.json`: caída máxima admitida (%) por tramo (línea principal / circuitos terminales / total).
9. `resistividades.json`: resistividad del cobre y el aluminio a la temperatura de servicio (si la norma o el curso la fija). Si no está en la norma, citar el módulo del curso.
10. `coeficientes-simultaneidad.json`: los que use el curso o la norma para calcular la demanda (por grado, por tipo de circuito).
11. `artefactos-tipicos.json` (**no es normativo**, sale del curso o del usuario): nombre, potencia típica (W), cos φ, si requiere circuito propio. `fuente.documento` = módulo del curso o "usuario".

## Tareas
1. Crear `src/dominio/normas/tipos.ts` con los tipos de arriba.
2. Crear un esquema `zod` por tabla en `src/dominio/normas/aea770/esquemas.ts`.
3. Crear `src/dominio/normas/aea770/index.ts`, que exporta un objeto `aea770` con las tablas parseadas y tipadas.
4. Transcribir las tablas 1 a 11. Si una tabla está ilegible en el escaneo, cargá las filas que puedas y pedile al usuario el resto, indicándole la página.
5. Test `src/dominio/normas/aea770/tablas.test.ts`:
   - todas las tablas validan su esquema,
   - ninguna fila carece de `fuente`,
   - un listado de cuántos valores siguen con `verificado: false`. El test no falla por eso, solo lo informa por consola.
6. Script `npm run norma:pendientes`, que lista todas las tablas o filas con `verificado: false` y su página, para que el usuario las revise.

## Tests obligatorios
- Validación de esquemas (tarea 5).
- `calibres-normalizados` está ordenado de forma ascendente y no tiene duplicados.
- `corrientes-admisibles`: para un mismo método, Iz crece con la sección.

## Criterios de aceptación
- `npm test` en verde.
- `npm run norma:pendientes` muestra el listado.
- No hay PDFs ni texto extenso de la norma en el repo.

## Datos ya confirmados
- Norma: **AEA 90364-7-770, edición 2017**.
- Tensiones nominales: 220 V mono / 380 V tri.
- `MODULO_6_1.pdf` es un duplicado de `MODULO_6.pdf`.

## Preguntas abiertas (hacerlas antes de empezar)
- Si al transcribir encontrás ejercicios resueltos en los Módulos 1 a 5, anotá la página en `docs/plan/ejercicios.md` (se usan como tests en la Fase 1). El usuario no encontró ninguno por ahora.

## Al terminar
Marcá la Fase 0 en `docs/plan/README.md`, hacé commit y push.
