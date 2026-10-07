# Pendientes de la Fase 0

Se resuelven antes de cerrar la Fase 1 los marcados **[bloquea F1]**; el resto se puede dejar para el final de todas las fases. `npm run norma:pendientes` lista además cada fila con `verificado: false`.

## Decisiones

- **P1 [bloquea F1] Edición/criterio del curso vs. Guía AEA 770 (2017).** El Módulo 4 calcula con 150 VA por boca de iluminación, 1 boca cada 20 m², 66 % de simultaneidad y grados por VA (6000 VA). La Guía 2017 usa 60 VA por boca, 1 boca cada 18 m², 2/3 y grados por superficie. Hay que decidir cuál es la fuente de verdad (se asumió la Guía 2017, que es la edición confirmada) y si los ejercicios del curso se adaptan.

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
- **P11 Artefactos típicos**: los Módulos 1 a 5 no traen potencias de artefactos. Los provee el usuario (nombre, W, cos φ, si lleva circuito propio) o se cargan en la Fase 2 desde el catálogo.

## Verificación

- **P12** El usuario confirma cada tabla contra el PDF y pasa `verificado` a `true`.
- **P13** Los números de página son los impresos en la Guía o el Manual; pueden no coincidir con los del PDF.
- **P14** Los valores leídos de OCR (Tabla 45, resistividades) pueden tener errores de lectura.
