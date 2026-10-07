# Fase 5: Extras y escalado

Cada bloque es independiente. Hacé uno por sesión y preguntale al usuario por cuál empezar.

## 5.A Plano en grilla
**Objetivo**: dibujar la planta de forma simple y ubicar los elementos para que la app estime los largos de cable sola.
- Ambientes como rectángulos sobre una grilla, con medidas en metros.
- Íconos del catálogo de la Fase 2 que se pueden arrastrar (en móvil: tocar el ícono y después tocar el lugar; pinch para zoom).
- Posición del tablero.
- `largoDesdePlano(circuito, plano)`: recorrido ortogonal (Manhattan) desde el tablero por las bocas + subida y bajada por altura de montaje (configurable). Reemplaza la estimación cuando hay plano. Se mantiene la etiqueta "desde plano".
- Mismo modelo `Proyecto` con un campo opcional `plano?: { ambientes: Rect[]; posiciones: Record<elementoId, {x,y}>; tablero: {x,y} }`.
- Librería sugerida: `react-konva` o SVG propio. Probar el rendimiento en un celular de gama media.

## 5.B Otras secciones de la norma (locales, oficinas, pública concurrencia, eventos, industria)
**Objetivo**: soportar otros `tipoInmueble` sin tocar el motor.
- Nuevo módulo `src/dominio/normas/aea771/` (u otro que corresponda), con la misma estructura de tablas y `fuente` de la Fase 0.
- Registro de normas: `normasPorTipoInmueble: Record<TipoInmueble, ModuloNorma>`.
- `asignarCircuitos` / `validarProyecto` reciben el módulo. Las reglas propias van como funciones del módulo (`reglasExtra(p): Hallazgo[]`).
- Catálogo de ambientes y elementos por tipo de inmueble.
- Requiere que el usuario consiga las secciones correspondientes de la norma. **No inventar valores.**

## 5.C Proveedor de precios real
- Implementar `<Proveedor>PriceProvider` (API, archivo de lista de precios o scraping permitido por los términos del sitio).
- Tabla de mapeo `codigoInterno ↔ codigoProveedor`, editable en `/ajustes/precios`.
- Cache con fecha y botón "actualizar precios".
- La ruta del servidor obtiene los precios (por CORS y credenciales). Nunca credenciales en el cliente.

## 5.D Nube, multi-dispositivo y multi-usuario
- Sincronización de proyectos IndexedDB ↔ Postgres (Supabase o Neon), con resolución de conflictos por `actualizado`.
- Login (si no se hizo en la Fase 4) y `ownerId` en cada proyecto.
- Si se suman más usuarios: revisar las licencias de contenido normativo antes de abrir la app.

## 5.E Calidad de vida
- Modo oscuro.
- Compartir un cálculo como link (estado codificado en la URL).
- Historial de cálculos.
- Plantillas de proyecto (monoambiente, casa 2 dormitorios).

## Criterios comunes
- `npm run lint && npm test && npm run e2e && npm run build` en verde.
- Mobile first y offline donde aplique.
- Ningún valor normativo sin `fuente`.

## Al terminar cada bloque
Agregalo como sub-ítem marcado en `docs/plan/README.md`, hacé commit y push.
