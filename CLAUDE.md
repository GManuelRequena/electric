# CLAUDE.md — App Electricista (AEA 90364)

App web **personal** de estudio y trabajo para un Electricista Instalador en Argentina.
Calcula circuitos, cables y protecciones según la reglamentación **AEA 90364** (empezando por viviendas, sección 770/771), arma proyectos con un catálogo de elementos y genera presupuestos de materiales.

El plan completo está en `docs/plan/`. Leé `docs/plan/00-vision.md` y la fase que te pidan antes de tocar código.

## Reglas que nunca se rompen

1. **Mobile first.** Cada pantalla se diseña primero para 390×844. Desktop es la misma UI más ancha. Botones ≥ 44px, una columna, navegación inferior, `inputMode="decimal"` en campos numéricos.
2. **Los cálculos son deterministas y sin IA.** Todo cálculo eléctrico vive en `src/dominio/` como funciones puras de TypeScript con tests. La IA (fase 4) solo explica y llama a estas funciones; nunca calcula.
3. **Ningún valor de la norma se inventa.** Los valores normativos (secciones, corrientes admisibles, límites de bocas, calibres, grados de electrificación, etc.) solo pueden salir de `src/dominio/normas/**`, y cada uno lleva su `fuente` (norma, sección, artículo o tabla, página). Si no tenés el valor verificado, cargalo con `verificado: false` y el comentario `PENDIENTE_VERIFICAR`, y avisale al usuario. No uses valores "de memoria" como si fueran verificados.
4. **La UI siempre muestra el paso a paso y la cita** (por ejemplo "AEA 770, tabla X"). Si se usa un valor con `verificado: false`, la UI lo marca con un aviso visible.
5. **No se suben PDFs ni el texto completo de la norma al repo** (tiene copyright). Solo tablas transcriptas en JSON con su cita. `material/` y `*.pdf` están en `.gitignore`.
6. **Aviso legal visible**: "Herramienta de estudio. No reemplaza el criterio profesional ni la firma de un instalador habilitado."
7. **Escalable por módulos**: lo normativo va en un módulo por sección (`normas/aea770`, en el futuro `aea771`, `aea718`...). El motor no conoce valores concretos, recibe las tablas.

## Stack

- Next.js (App Router) + TypeScript `strict` + Tailwind CSS, como PWA.
- Vitest para unit tests y Playwright para E2E (viewport móvil 390×844 + desktop 1280×800).
- Persistencia local (IndexedDB vía `idb` o `dexie`) en las fases 1 a 3. La nube llega más adelante.
- Deploy en Vercel.

## Convenciones

- **Idioma**: el dominio y la UI en **español** (`calcularCircuito`, `Ambiente`, `seccionMm2`). Los nombres técnicos genéricos (hooks, utils) pueden ir en inglés.
- **Unidades en el nombre**: `potenciaW`, `corrienteA`, `seccionMm2`, `largoM`, `tensionV`.
- **Estructura**:
  ```
  src/app/                    páginas y UI
  src/componentes/            componentes UI reutilizables
  src/dominio/calculo/        funciones puras de cálculo
  src/dominio/normas/aea770/  tablas JSON + loaders tipados
  src/dominio/proyecto/       modelo de datos del proyecto
  src/dominio/circuitos/      asignación de circuitos + validador
  src/dominio/computo/        proyecto → materiales
  src/integraciones/          precios, consulta (NotebookLM/IA), persistencia
  ```
- `src/dominio/**` **no importa nada de React, Next ni del navegador**.
- Cada función nueva de `src/dominio/` lleva su test en `*.test.ts` al lado.

## Comandos

```
npm run dev      # servidor local
npm test         # vitest
npm run lint     # eslint + tsc --noEmit
npm run e2e      # playwright
npm run build
```

Antes de cada commit: `npm run lint && npm test` en verde.

## Flujo de trabajo

- Trabajá **una fase a la vez**, siguiendo `docs/plan/fase-N-*.md`.
- Si la fase tiene "Preguntas abiertas", hacelas antes de suponer las respuestas.
- Al terminar una fase: marcá el checklist en `docs/plan/README.md`, commit y push.
