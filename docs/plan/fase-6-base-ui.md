# Fase 6: Base de UI (sensación de app)

Referencia de estilo: [`docs/ui/filosofia-ui.md`](../ui/filosofia-ui.md). Leela antes de empezar.

## Objetivo

Que la app se sienta instantánea y cuidada en el celular y en desktop: transición de navegación con barra de progreso, esqueletos con la forma real, entrada escalonada de elementos y un sistema de tokens (color y movimiento) que las pantallas existentes y las futuras reutilicen.

No cambia ningún cálculo ni ningún valor normativo. `src/dominio/**` no se toca.

## Alcance

**Sí**
- Tokens de diseño en `src/app/globals.css`: superficies, colores semánticos (claro y oscuro), duraciones y easings.
- Componentes en `src/componentes/`:
  - `Esqueleto` (bloque con brillo) y variantes de lista y tarjeta.
  - `BarraProgreso` de navegación (barra fina arriba que se completa al llegar la ruta).
  - `ListaAnimada` (entrada escalonada de hijos).
  - Shell responsive: la `NavInferior` actual en mobile y una sidebar en desktop, con columna central acotada.
  - `CampoImporte` (campo principal grande con foco automático) para los formularios de cálculo.
  - Botón principal fijo abajo en formularios largos.
- `loading.tsx` por ruta principal con la forma real de la pantalla.
- Aplicar a: `/calcular/*`, `/proyectos`, `/presupuesto`, `/consultar` y `/ajustes`.
- Respetar `prefers-reduced-motion`, `safe-area` y `tabular-nums` en importes y resultados.

**No**
- Cambiar la lógica de cálculo, las tablas de la norma ni los textos legales.
- Rediseñar el plano en grilla ni el unifilar (se revisan en otra fase si hace falta).
- Copiar CSS, textos o marca de la app de referencia.

## Reglas que se mantienen (de `CLAUDE.md`)

- Mobile first (390×844), botones ≥ 44 px, `inputMode="decimal"` en campos numéricos.
- La UI sigue mostrando el paso a paso y la cita. Lo nuevo (esqueletos y animaciones) no puede ocultarlos ni retrasar su lectura: el paso a paso aparece con entrada escalonada, pero completo.
- Si se usa un valor con `verificado: false`, el aviso visible se conserva y no se anima de forma que distraiga.
- Aviso legal visible en todas las pantallas.

## Pasos sugeridos

1. Inventario: listar los componentes y las pantallas actuales y qué clases de color usan (hoy el modo oscuro reasigna los grises, rojos, ámbar y esmeralda de Tailwind).
2. Tokens: definir variables semánticas (superficie, texto, positivo, negativo, advertencia, no verificado, marca) y los tokens de movimiento. Migrar el modo oscuro a esos tokens sin romper `.fondo-claro` (informe y unifilar).
3. Movimiento y esqueletos: `Esqueleto`, `BarraProgreso` y `ListaAnimada`, con tests de render y de `prefers-reduced-motion`.
4. Shell responsive: sidebar en desktop y barra inferior en mobile, sobre la navegación actual.
5. Rutas: `loading.tsx` y entrada escalonada en las pantallas de la lista de alcance, empezando por `/calcular`.
6. Formularios: `CampoImporte` y botón principal fijo en las calculadoras.
7. Verificación: `npm run lint && npm test`, E2E en 390×844 y 1280×800, y revisión en el celular.

## Criterios de aceptación

- Al navegar entre secciones se ve la barra de progreso y un esqueleto con la forma de la pantalla; no hay saltos de layout.
- El sidebar de desktop y la barra inferior de mobile comparten las mismas rutas y el mismo ítem activo.
- Con `prefers-reduced-motion: reduce` no hay movimiento y la app sigue siendo usable.
- Modo claro y oscuro consistentes; el informe y el unifilar impresos siguen claros.
- Todos los E2E existentes siguen en verde, con capturas nuevas a 390×844 y 1280×800.
- `npm run lint && npm test` en verde.

## Preguntas abiertas

Hacerlas antes de empezar:

1. **Marca y paleta.** Hoy el tema usa ámbar (`#f59e0b`). ¿Se mantiene como color de marca o preferís otro (por ejemplo violeta, azul o verde)?
2. **Migración del modo oscuro.** ¿Migramos todo a tokens semánticos de una vez (más prolijo, toca muchos archivos) o de a poco, pantalla por pantalla?
3. **Navegación.** ¿Qué 5 posiciones querés en la barra inferior y cuál es la acción central destacada (por ejemplo "Calcular" o "Nuevo proyecto")?
4. **Desktop.** ¿Sidebar fija siempre o colapsable? ¿Ancho máximo de la columna central?
5. **Alcance de pantallas.** ¿Todas las de la lista o empezamos solo por `/calcular` y `/proyectos`?
