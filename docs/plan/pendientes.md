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
