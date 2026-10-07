# Pendientes

## Lo que tenés que verificar vos (checklist)

Marcá cada punto cuando lo hayas revisado contra los PDFs, y pasá `verificado` a `true` en el JSON correspondiente (`src/dominio/normas/aea770/`). `npm run norma:pendientes` lista cada fila sin verificar.

### Antes de dar por buena la Fase 1 (bloquean la calculadora)

- [ ] **Tabla de corrientes admisibles 2017** (770.12.I y 770.12.III): pasame las páginas o una foto. Hoy se usa la Tabla 45 del curso (P2).
- [ ] **Circuitos mínimos por grado** (Tabla 770.7.II) y su composición: están en `null` (P3).
- [ ] **Los 9 casos de `casos-referencia.test.ts`** (`REVISAR_USUARIO`): rehacé las cuentas a mano y confirmá los resultados (P15).
- [ ] **Potencias del catálogo de artefactos**: las 22 son orientativas y las puse yo (P11). Corregilas con el dato de chapa o del curso.

### Valores transcriptos que hay que confirmar contra el PDF

- [ ] Tipos de circuito: IUG, TUG y TUE (bocas, VA, calibre, sección; Guía pág. 22-23).
- [ ] Circuitos de uso específico e IUE (MBTF, APM, ATE, MBTS, ACU, OCE): faltan datos (P6).
- [ ] Límites de los grados por superficie (60 / 130 / 200 m²) y si cada límite es inclusivo (P7).
- [ ] Bocas mínimas por ambiente: estar-comedor, pasillo, vestíbulo, baño, cocina; faltan dormitorio, lavadero, garage y exterior (P4).
- [ ] Calibres máximos de protección: solo 1,5 y 2,5 mm² y tres columnas (P5).
- [ ] Calibres normalizados 6 a 63 A (cargados sin cita de página; P8).
- [ ] Curvas B/C/D y diferenciales (Guía pág. 44).
- [ ] Caída de tensión 3 % / 5 % / 15 % y si la norma la desglosa por tramo (P9).
- [ ] Secciones mínimas (IUG 1,5; IUG con tomas derivadas 2,5; TUG, TUE e IUE 2,5; PAT 4; PE 2,5).
- [ ] Resistividad a la temperatura de servicio; hoy se usa la del curso a 15 °C (P10).
- [ ] Datos del curso usados como respaldo: Iz (Tabla 45), factores de temperatura (Tabla 46) y de conductores por caño (Tabla 47). Pueden tener errores de lectura del OCR (P14).

### Fase 2 (proyectos): decisiones y datos a revisar

- [ ] **Respuestas a las preguntas abiertas de la Fase 2** (P22): catálogo de elementos, valores por defecto de largos y símbolos del unifilar. Hoy son los del plan y los míos.
- [ ] **Tomas exteriores → TUE**: la app las asigna a TUE porque la nota de la tabla dice "instalaciones a la intemperie" (P23).
- [ ] **Circuitos mínimos por grado**: la app no completa circuitos mínimos porque la Tabla 770.7.II sigue en `null` (P3); el validador avisa `PENDIENTE_VERIFICAR`.
- [ ] **Bocas mínimas**: dormitorio, lavadero, garage y exterior no tienen reglas cargadas (P4); el validador lo informa en vez de aprobar (P24).
- [ ] **IUG con tomas derivadas**: se informa como advertencia, no error, porque la tabla de IUG lo admite con 2,5 mm² y DPMS 2200 VA (P25).

### Decisiones de la app que conviene que revises

- [ ] Semáforo de caída: ámbar por encima del 90 % del límite (P17).
- [ ] Reglas para sugerir el tipo de circuito (P18).
- [ ] Fórmula de caída con cos φ, que el curso no incluye (P16).
- [ ] Iz de monofásico tomada de la tabla de tres cables por caño (P19).

### Pruebas fuera del entorno de desarrollo

- [ ] Probar la app instalada en tu celular, también sin conexión (P20).
- [ ] Deploy en Vercel y Lighthouse PWA (P20).

---

## Detalle de los pendientes (Fase 0)

Se resuelven antes de cerrar la Fase 1 los marcados **[bloquea F1]** (P2 y P3); el resto se puede dejar para el final de todas las fases. `npm run norma:pendientes` lista además cada fila con `verificado: false`.

## Decisiones

- **P1 [resuelto] Fuente de verdad: Guía AEA 770 (edición 2017).** Decisión del usuario. Ante cualquier diferencia con el curso (150 VA por boca, 1 boca cada 20 m², 66 %, grados por VA), manda la Guía (60 VA por boca, 1 boca cada 18 m², 2/3, grados por superficie). Los datos del curso se usan solo como respaldo, marcados `verificado: false`, y no para tests. Los ejercicios del Módulo 4 no se convierten en tests tal cual: se recalculan con los criterios de la Guía.

## Datos que faltan

- **P2 [bloquea F1] Corrientes admisibles 2017** (Tabla 770.12.I y 770.12.III). Hoy `corrientes-admisibles.json` tiene la Tabla 45 del curso (cobre, cañería, 40 °C). Falta la tabla de la reglamentación.
- **P3 [bloquea F1] Circuitos mínimos por grado** (Tabla 770.7.II) y demanda por grado: están en `null`.
- **P4 Bocas mínimas por ambiente** (Tabla 770.7.I): faltan dormitorio, cocina completa, lavadero, garage y exterior; la columna del grado mínimo es ambigua.
- **P5 Calibres máximos de protección**: faltan filas de más de 2,5 mm² y las columnas de cable subterráneo.
- **P6 Circuitos de uso específico e IUE** (Sección 771): faltan potencias, calibres y secciones en IUE, MBTF, APM, ATE, MBTS, ACU y OCE.
- **P7 Límites de los grados** (60/130/200 m²): ¿inclusivos o exclusivos?
- **P8 Calibres normalizados** (6 a 63 A): serie estándar cargada sin cita de la Guía.
- **P9 Caída de tensión por tramo**: la Guía da 3 % / 5 % / 15 %; falta ver si la norma desglosa por línea principal, seccional y terminal.
- **P10 Resistividad a temperatura de servicio**: el curso da 0,0175 Ω·mm²/m a 15 °C; la caída de tensión necesita el valor a la temperatura de servicio.
- **P11 Artefactos típicos**: los Módulos 1 a 5 no traen potencias. Se cargó una lista provisoria de 22 artefactos (potencias orientativas, `verificado: false`). Reemplazar por datos del curso o del usuario.

## Verificación

- **P12** El usuario confirma cada tabla contra el PDF y pasa `verificado` a `true`.
- **P13** Los números de página son los impresos en la Guía o el Manual; pueden no coincidir con los del PDF.
- **P14** Los valores leídos de OCR (Tabla 45, resistividades) pueden tener errores de lectura.

## Pendientes de la Fase 1

- **P15 Casos de referencia**: `src/dominio/calculo/casos-referencia.test.ts` está marcado `REVISAR_USUARIO`. Verificar a mano los 9 casos (la cuenta está en los comentarios). Las potencias del aire acondicionado (1200 W para 3000 frigorías) y los demás artefactos son orientativas.
- **P16 Caída de tensión**: la fórmula sigue el curso (ΔU = I · ρ · 2L / S, Módulo 4, pág. 342) y le suma cos φ, que el curso no usa. La resistividad es la del curso a 15 °C (P10). Por defecto la calculadora dedicada usa el límite de iluminación (3 %), el más exigente.
- **P17 Semáforo**: verde si la caída es ≤ 90 % del límite, ámbar entre 90 % y 100 %, rojo si lo supera. El 90 % es un criterio de la app, no de la norma.
- **P18 Tipo de circuito sugerido**: reglas de la app basadas en la Guía (consumo unitario > 10 A o equipo con circuito propio → TUE; trifásico o > 20 A → ACU/OCE; el resto TUG, o IUG si es solo iluminación). Revisar contra la norma.
- **P19 Iz en monofásico**: la Tabla 45 del curso es para tres cables por caño; se usa tal cual también para circuitos monofásicos (conservador). Aluminio: no hay tabla cargada, la calculadora avisa.
- **P20 No hecho**: deploy en Vercel, prueba Lighthouse y prueba offline en un celular real (el modo avión se probó en Playwright).
- **P21 TypeScript fijado en 6.x**: `typescript-eslint` todavía no soporta TypeScript 7.

## Pendientes de la Fase 2

- **P22 Preguntas abiertas sin respuesta del usuario**: (a) catálogo: se usan los 8 elementos del plan más los 22 artefactos provisorios (P11); faltan portero, timbre, TV/datos, bomba y calefón como elementos propios (la bomba y el calefón se cargan como artefacto "Otro"); (b) `metrosPorBoca` = 4 m y `metrosHastaTablero` = 5 m son valores míos (editables en la pestaña Tablero de cada proyecto, no son de la norma); (c) el unifilar dibuja el termomagnético y el diferencial con símbolos tipo IRAM 2010 / IEC hechos a mano, sin verificar contra la IRAM 2010-3 (no está en el repo ni se encontró en línea). Investigación en línea sobre (a) y (b): no se encontró una cifra confiable de metros por boca ni el texto de la Sección 771; hace falta el PDF.
- **P23 Tomas exteriores**: `toma_exterior` se asigna a TUE por la nota de la tabla de tipos de circuito ("instalaciones a la intemperie"). Confirmar contra la Guía.
- **P24 Reglas por ambiente incompletas**: sin mínimos cargados para dormitorio, lavadero, garage y exterior (P4), la validación solo informa que falta el dato. La cocina exige 2 TUG (P4, `verificado: false`).
- **P25 IUG con tomas**: advertencia y no error (ver arriba). La asignación automática nunca los mezcla.
- **P26 Demanda de los circuitos**: cada boca de luz suma 60 VA (sin el 2/3 de simultaneidad, igual que la Fase 1) y los TUG/TUE se calculan con la demanda mínima de la tabla (2200 / 3300 VA) o la carga real si es mayor. Todos con `verificado: false` (P1).
- **P27 Límite de corriente para abrir otro circuito**: se usa el calibre máximo de protección del tipo (IUG 16 A, TUG 20 A, TUE 32 A) como tope de Ib. Revisar si es el criterio correcto.
- **P28 Circuitos terminales siempre monofásicos a 220 V**: `Proyecto.sistema` es el de la acometida. Un artefacto de más de 20 A cae en ACU y se calcula igual en monofásico.
- **P29 Ruta del proyecto**: se usa `/proyectos/ver?id=…` en lugar de `/proyectos/[id]` para que el service worker pueda servir la pantalla sin conexión con cualquier proyecto.
- **P30 No hecho**: medir en el celular que una vivienda de 4 ambientes se carga en menos de 3 minutos; probar la app instalada sin conexión en un celular real.

## Pendientes de la Fase 3

- **P31 Catálogo de materiales** (`src/dominio/computo/materiales.json`): nombres, presentaciones (rollo de 100 m para cable, de 25 m para caño) y la lista de ítems son genéricos y míos; no salen de la norma ni del curso. Reemplazar por tus marcas y presentaciones. Los gabinetes se ofrecen en 4, 6, 8, 12, 18, 24, 36 y 48 módulos.
- **P32 Criterios del cómputo que no son de la norma** (todos editables en `ConfigComputo`, `verificado: false`): desperdicio 10 % de cable y caño; una caja de paso estimada cada 5 bocas de un circuito; 20 % de reserva de módulos en el gabinete; bajada de la jabalina en cable de 6 mm² con el largo de `metrosHastaTablero`; térmica general y diferencial de 40 A si el tablero no define la general; térmica general con curva C. Las cajas: octogonal para luces y rectangular para teclas, tomas y artefactos fijos (la mignon está en el catálogo pero no se usa).
- **P33 Colores de los conductores**: fase marrón, neutro celeste, PE verde/amarillo. Confirmar contra la Guía (el neutro y el PE sí son de uso corriente; el color de fase depende de la fase).
- **P34 Sección del PE**: se usa la del circuito con el mínimo de la tabla "PE de circuitos terminales" (2,5 mm², Cl. 770.14.1, `verificado: false`). La regla S ≤ 16 → S figura solo en la nota de `secciones-minimas.json`.
- **P35 Largos estimados**: los circuitos sin largo cargado usan la estimación de la Fase 2 (P22b). El cómputo y el presupuesto marcan esas líneas como "estimado".
- **P36 Mano de obra, moneda y proveedor**: las preguntas abiertas de la fase quedaron sin respuesta. Se dejaron los tres modos (por boca, por hora, monto fijo; la "boca" es la misma que usa la Fase 2), precios en ARS y USD con una cotización manual y un solo proveedor ("Precios propios", manual o importado). No hay ajuste por inflación. `MockPriceProvider` es solo un ejemplo de la interfaz.
- **P37 Informe**: la "demanda con simultaneidad" y el consumo energético (kWh y tarifa) de la estructura detallada no se hicieron; el resumen muestra la potencia de los circuitos (suma de las demandas de cada uno). La ficha por circuito usa el paso a paso de la Fase 1; no hay unifilar individual por circuito (solo el general). El informe se imprime con `window.print()` ("Guardar como PDF"); el pie "Página N de M" usa los márgenes de `@page`, que soporta Chrome pero no Safari.
- **P38 Compartir**: desde el celular se comparte el .xlsx del presupuesto con la Web Share API (si el navegador no puede compartir archivos se comparte el resumen en texto). No se probó en un celular real; el PDF se comparte desde el diálogo de impresión.
- **P39 Rutas**: como en la Fase 2 (P29), `/presupuesto/ver?id=…` y `/presupuesto/informe?id=…` en lugar de `[proyectoId]`, para que funcionen sin conexión. Las pantallas nuevas se agregaron al service worker (no se probó la app instalada sin conexión en un celular real).
- **P40 Datos en el dispositivo**: los precios y los datos del presupuesto viven en IndexedDB (la base pasó a la versión 2) y el perfil, el logo y la firma en localStorage. Borrar los datos del navegador los borra; no entran en el JSON del proyecto.

- **P41 Dependencia nueva**: `exceljs` (lectura y escritura de .xlsx), cargada de forma dinámica solo al importar o exportar Excel. `npm install` avisa de vulnerabilidades heredadas en dependencias de `exceljs`; revisar con `npm audit` antes de publicar. No se usa `papaparse`: el CSV se lee con un parser propio (`importar.ts`).
- **P42 Para probar a mano en el celular**: cargar una vivienda real, ver que el total fijo no tape los botones, importar una lista de precios CSV y otra XLSX, exportar el Excel, compartir y guardar el informe como PDF (versión cliente y técnica), y revisar el pie "Página N de M".

## Pendientes de la Fase 4

- **P43 Preguntas abiertas sin respuesta de Manu** (se eligió un valor por defecto, todo cambiable): (a) login con **contraseña única** (`APP_PASSWORD`) y cookie firmada de 30 días, sin Supabase; (b) **sin proveedor de embeddings**: el buscador es léxico (BM25) sobre un archivo local `data/indice-norma.json`, así no hace falta otra clave ni base de datos (pgvector queda como mejora si el corpus crece o la búsqueda léxica no alcanza); (c) tope de gasto mensual **10 USD** por defecto (`TOPE_USD_MES`, máximo 20); (d) las 20 preguntas de evaluación son un borrador mío.
- **P44 Cargar tus secretos (yo no los pedí ni los tengo)**: en Vercel o en `.env.local` poné `ANTHROPIC_API_KEY`, `APP_PASSWORD` y, si querés, `SESSION_SECRET` y `TOPE_USD_MES` (ver `.env.example`). Sin esas variables la API responde 503 con el motivo. En los tests la API de Claude está simulada: **nunca se probó contra la API real**.
- **P45 Correr `npm run eval:ia` con tu clave** y revisar el resultado (objetivo ≥ 80 %). Gasta unos centavos de USD. Las preguntas y qué se espera de cada una están en `tests/eval/preguntas.json`: reemplazalas o corregilas con tus casos reales (varias esperan solo "usó tal herramienta y citó", no un valor concreto, porque no tengo la norma para fijarlo).
- **P46 Ingesta de la Guía**: poné los PDF/TXT en `material/` (no se versiona) y corré `npm run ingestar`. El Módulo 6 es un escaneo: hay que pasarle OCR antes (`ocrmypdf MODULO_6.pdf MODULO_6_ocr.pdf`). Sin ingesta el asistente solo ve los títulos y notas de las tablas transcriptas, y debe decir "no está en las fuentes". Mirá que el partido por artículo (`770.x.y` al comienzo de línea) funcione con el texto real; si el OCR sale con otro formato hay que ajustar `partirPorArticulo`.
- **P47 Contador de gasto en disco**: el uso del mes se guarda en un archivo (`USO_ARCHIVO`, por defecto en la carpeta temporal). En Vercel ese disco no persiste, así que el tope no se aplicaría bien: hace falta un almacén externo (Vercel KV, Upstash, Postgres) implementando `AlmacenUso`. Los costos son una **estimación** con precios de Sonnet 5.5 (2 / 10 USD por millón de tokens, caché 0,2) copiados de la documentación el 2026-10-06; verificá contra tu facturación.
- **P48 Modelo y reglas**: el chat usa `claude-sonnet-5-5` con esfuerzo medio, sin pensamiento forzado y con prompt caching automático (el cache solo se activa si el prefijo supera el mínimo del modelo). No se activó el fallback automático ante rechazos del modelo: si el modelo se niega, la app lo informa. No hay límite de consultas por minuto, solo el tope mensual.
- **P49 El asistente puede equivocarse**: la regla "sin número normativo sin herramienta ni cita" está en el prompt y los números salen de las funciones del dominio, pero no hay un chequeo automático de que cada cifra de la respuesta venga de una herramienta. Las citas que se muestran son las de las herramientas usadas, no las que el texto menciona.
- **P50 Sin conexión**: el chat y "Revisar con IA" necesitan internet y sesión; sin ellos muestran un aviso y el resto de la app sigue andando. `/api/*` y `/login` se excluyeron del service worker. No se probó en un celular real.
- **P51 Datos que salen del dispositivo**: "Revisar con IA" manda el proyecto (ambientes, elementos, circuitos) a tu servidor y de ahí a Anthropic. No incluye perfil, logo ni precios.

## Pendientes de la Fase 5

- **P52 Bloques hechos y bloques sin hacer**: esta entrega cubre **5.E** (herramientas extra, salvo Icc) y **5.F** (modo oscuro, compartir por link, historial y plantillas). Quedan **5.B** (otras secciones de la norma), **5.C** (proveedor de precios real) y **5.D** (nube). Los de 5.B, 5.C y 5.D necesitan datos o cuentas que solo tenés vos (texto de la norma, proveedor/lista de precios, proyecto Supabase o Neon). (5.A, el plano, se hizo después: ver P59 a P63.)
- **P53 Icc (cortocircuito) no se hizo**: el plan pide preguntarte qué método usa el curso y qué datos de la red hay (impedancia, Icc en el punto de entrega). Sin eso no hay fórmula que cargar sin inventar.
- **P54 Fórmulas de 5.E**: Ohm, potencia CA (P = V·I·cos φ, √3 en trifásica), kWh y costo, Qc = P·(tan φ1 − tan φ2) y el dimensionado fotovoltaico son fórmulas generales de electrotecnia, **no valores de la AEA**: no hay tablas ni `fuente` normativa. El paso a paso lo aclara. Valores por defecto de la pantalla fotovoltaica (rendimiento 0,75, 2 días de autonomía, banco de 24 V, descarga 0,5) y cos φ objetivo 0,95 son **míos, orientativos**: ajustalos. En factor de potencia la app no asume el cos φ mínimo que exige la distribuidora; el fotovoltaico no verifica reglamentación de instalaciones FV (la AEA tiene otra parte para eso).
- **P55 Plantillas**: "Monoambiente" (20 + 6 + 4 m²) y "Casa de 2 dormitorios" (68 m² en 7 ambientes) traen solo ambientes con superficies de ejemplo; **no son valores de la norma** ni cargan elementos. Corregilas con las medidas que uses. Si querés plantillas con bocas y artefactos cargados, decime qué llevan.
- **P56 Compartir por link**: el estado de la calculadora viaja en la URL (`?s=`, base64 del JSON, sin cifrar; solo herramientas 5.E, no las calculadoras de circuito ni los proyectos). Quien abre el link ve los mismos números; no hay servidor de por medio. Usa la Web Share API si el navegador la tiene y si no copia el link. No se probó en un celular real.
- **P57 Historial**: ya existía "Últimos cálculos"; ahora guarda hasta 20, se puede borrar y las herramientas nuevas se anotan solas (con link que restaura los campos). Vive en localStorage del dispositivo.
- **P58 Modo oscuro**: opción "Tema" en Ajustes (automático, claro u oscuro). Se implementó reasignando las variables de color de Tailwind (no hay `dark:` por componente), así que **hay que revisar pantalla por pantalla en el celular** por si algún color fijo quedó ilegible. El informe de presupuesto y el diagrama unifilar se quedan siempre claros a propósito (se imprimen y usan colores fijos).

## Pendientes de 5.A (plano en grilla)

- **P59 Alturas de montaje**: tablero 1,5 m, luces y artefactos fijos 2,6 m y tomas 0,3 m son **valores míos, orientativos**, no de la AEA (no tienen `fuente`). Se editan por proyecto en la pestaña Plano. Corregilos con lo que uses en obra.
- **P60 Método del largo**: el recorrido sale del tablero y va siempre a la **boca más cercana que falta** (distancia ortogonal |Δx| + |Δy| + |Δaltura|), sin volver al tablero. Es una aproximación: no sigue paredes ni cañerías reales y no suma sobrantes, empalmes ni la derivación de las teclas. El largo queda marcado "desde plano" y la validación pide verificarlo en obra. Si querés otro criterio (por ejemplo ir por los ejes de cada ambiente), decime cuál.
- **P61 Prioridad del largo**: el largo cargado a mano gana al del plano, y el del plano gana a la estimación. Un circuito usa el plano solo si **todas** sus bocas y el tablero están ubicados; si falta alguna, sigue la estimación (la pestaña Plano muestra cuántas faltan). Solo cuentan las bocas (luces, tomas, artefactos fijos); las teclas no se dibujan.
- **P62 Cómo se usa**: se agregan ambientes como rectángulos (3 × 3 m, o según su superficie en proporción 4:3) y se ajustan con los campos x, y, ancho y alto. Arrastrar mueve la vista o el objeto (rejilla de 0,1 m); dos dedos hacen zoom; también hay botones + / − / encuadrar. Se usó SVG propio, sin librerías nuevas. **No se probó en un celular real**, solo en Chromium móvil emulado (390 × 844): probá el arrastre y el pellizco con el dedo.
- **P63 Datos del plano**: se guarda en el mismo proyecto (`plano` opcional, en metros), va en el backup JSON y se poda solo si borrás ambientes o elementos. Los proyectos viejos siguen funcionando sin plano.
