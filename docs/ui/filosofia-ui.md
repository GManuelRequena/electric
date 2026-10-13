# Filosofía de UI (portable)

Guía de estilo y de sensación de uso para apps mobile first con datos y formularios. **No es específica de este proyecto**: se puede copiar tal cual a otro repo y adaptar la paleta y los nombres.

Surgió de estudiar una app de finanzas personales (plata.wtf) en mobile (390×844) y desktop (1280×800), en octubre de 2026. Se interpretó la técnica, **no se copió su CSS, sus textos ni su marca**.

## En una frase

La app tiene que sentirse **instantánea, calma y legible de un vistazo**: responde antes de terminar de cargar, muestra la forma de lo que viene, y cada color, tamaño y movimiento significa algo.

## Principios

1. **Respuesta inmediata.** Al tocar, algo cambia en menos de 100 ms (ítem activo, barra de progreso). Nunca una pantalla congelada.
2. **Mostrar la forma antes que el dato.** Esqueletos con el tamaño real del contenido. Cero saltos de layout.
3. **El marco no se redibuja.** La navegación (barra inferior o sidebar) queda quieta, solo cambia el contenido.
4. **Un solo dato protagonista por pantalla.** El número o el campo principal es el más grande y tiene el foco.
5. **El color es semántico.** Rojo, verde, ámbar y violeta significan siempre lo mismo en toda la app. Cada categoría tiene su color e ícono fijo.
6. **Mobile es el diseño; desktop es el mismo diseño con otro marco.** Misma columna angosta y centrada, barra inferior que pasa a sidebar. No se rediseña por separado.
7. **Lo avanzado se ve, pero explicado.** Opciones como casillas con una línea de ayuda, en lugar de esconderlas en menús.
8. **El movimiento informa, no decora.** Corto, suave, y siempre desactivable.

## Navegación y carga (4 piezas que trabajan juntas)

| Pieza | Qué hace | Detalle |
|---|---|---|
| Ítem activo inmediato | El tab/ítem se marca al tocar, antes de que llegue la pantalla | Estado optimista del cliente |
| Barra de progreso | Línea fina arriba que crece con `scaleX` | 0 → ~55 % → ~92 % en ~1,4 s, easing exponencial; se completa al llegar |
| Esqueletos | Bloques con la forma del contenido y un brillo que se desplaza | Gradiente de 3 tonos, `background-position` animado, ~1,4 s en loop |
| Entrada escalonada | Cada bloque entra con fundido + `translateY` chico | 6–10 px, 0,22–0,42 s; en listas, retraso creciente por hijo |

Después, los datos "cobran vida": barras que crecen (`scaleX`, ~0,65 s), importes que entran desde arriba o abajo según suban o bajen, y un rebote mínimo en los dígitos que cambian.

## Tokens de movimiento

| Uso | Duración | Easing |
|---|---|---|
| Aparición de ítems y listas | 0,22 s | `cubic-bezier(.16,1,.3,1)` |
| Tarjetas y bloques grandes | 0,34–0,42 s | `cubic-bezier(.16,1,.3,1)` |
| Importes que cambian | 0,42 s | `cubic-bezier(.22,1,.36,1)` |
| Salidas (cerrar, quitar) | 0,16–0,18 s | `ease-in` |
| Hojas modales | 0,26 s sube / 0,18 s baja | `cubic-bezier(.16,1,.3,1)` |
| Barras y progreso | 0,65 s / 1,4 s | `cubic-bezier(.16,1,.3,1)` / `.22,1,.36,1` |

Reglas: se anima solo `transform` y `opacity`; las salidas son más rápidas que las entradas; el rebote (`.34,1.56,.64,1`) se reserva para detalles chicos.

## Layout

- **Mobile**: una columna, barra inferior de 5 posiciones con una acción principal central, grande y destacada (`+`). Usar `safe-area-inset` arriba y abajo.
- **Desktop**: sidebar izquierda fija con logo, secciones y usuario. Contenido en una columna central de ancho acotado (no se estira a toda la pantalla).
- Hoja modal en mobile (sube desde abajo) → diálogo centrado desde ~640 px.
- Breakpoints usados como referencia: 640, 768, 1024, 1280 y 1536 px.
- Botones y áreas táctiles ≥ 44 px (los principales, 48–56 px).

## Pantallas tipo

- **Panel**: bloque protagonista arriba (el total), selector de período segmentado, dos tarjetas de color con la acción rápida, después gráficos y listas.
- **Lista agrupada**: encabezado por grupo con subtotal a la derecha; filas dentro de una tarjeta; ícono de categoría con color, título, subtítulo (`categoría · cuenta · hora`), importe y acción secundaria al costado. Arriba: período, pestañas de filtro, búsqueda y una fila de totales.
- **Formulario de alta**: el campo principal grande y con foco; categorías como grilla de íconos con color (4 columnas mobile, 6 desktop); atajos para lo más común (por ejemplo fecha: Hoy / Ayer / Anteayer); opciones avanzadas como casillas con explicación; botón de guardar **fijo abajo**, encima de la navegación.

## Color y tipografía

- Tokens semánticos con modo oscuro desde el día uno: positivo, negativo, advertencia, neutro y marca, cada uno con su versión "suave" para fondos.
- Una escala de superficies (base, elevada, hundida, hover) en vez de colores sueltos.
- Cada categoría o tipo tiene color e ícono propios y los conserva en toda la app.
- Los números van con `tabular-nums` para que no bailen al cambiar.
- La jerarquía sale del tamaño y del peso de la letra, con pocas líneas divisorias.

## Accesibilidad y rendimiento

- `prefers-reduced-motion: reduce` apaga las animaciones. La barra de progreso queda estática; el contenido aparece sin movimiento.
- Animar solo `transform` y `opacity`.
- El foco visible y el orden de tabulación se mantienen en los modales y hojas.
- Los esqueletos y la barra de progreso no deben anunciarse como contenido a lectores de pantalla (`aria-hidden`), y el contenedor que carga lleva `aria-busy`.

## Qué NO hacer

- No copiar el CSS, los textos, el logo ni la marca de la app de referencia. Se copia la idea, no el archivo.
- No poner spinners genéricos donde se puede poner un esqueleto con la forma real.
- No animar propiedades que fuerzan layout (`width`, `height`, `top`).
- No inventar colores por pantalla: si hace falta uno nuevo, se agrega como token.
- No esconder lo importante en menús para que "quede limpio".

## Checklist para un proyecto nuevo

- [ ] Tokens de color semánticos (claro y oscuro) y escala de superficies.
- [ ] Tokens de movimiento (duraciones y easings de la tabla de arriba).
- [ ] Shell: barra inferior en mobile, sidebar en desktop, columna central acotada.
- [ ] Barra de progreso de navegación + ítem activo inmediato.
- [ ] Componente de esqueleto y un `loading` por ruta con la forma real.
- [ ] Lista con entrada escalonada.
- [ ] Campo principal grande con foco automático en los formularios de alta.
- [ ] Botón principal fijo abajo en formularios largos.
- [ ] `prefers-reduced-motion`, `safe-area`, `tabular-nums`.
- [ ] Probado en 390×844 y 1280×800.

## Cómo llevarla a otro proyecto

Copiá este archivo a `docs/ui/filosofia-ui.md` del repo nuevo y sumá una línea en su `CLAUDE.md`: "Seguí `docs/ui/filosofia-ui.md` para la UI". Para que valga en todos tus repos, también podés pegar el resumen de "Principios" en tu `CLAUDE.md` personal (`~/.claude/CLAUDE.md`) en tu computadora.
