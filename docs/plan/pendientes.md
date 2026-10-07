# Pendientes de la Fase 0

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
