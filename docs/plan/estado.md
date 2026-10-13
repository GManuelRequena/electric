# Estado del proyecto

Resumen corto para retomar el trabajo en una sesión nueva sin releer todo. Se actualiza **al cerrar cada fase o bloque** (ver [verificacion-fase.md](verificacion-fase.md)). El detalle de fases está en [README.md](README.md) y los datos normativos por confirmar en [pendientes.md](pendientes.md).

## Dónde estamos

- **Hecho**: Fases 0 a 4; Fase 5 bloques 5.A (plano en grilla), 5.E (herramientas extra) y 5.F (calidad de vida).
- **En curso**: nada.
- **Siguiente**: a definir con el usuario (5.B otras secciones de la norma, 5.C precios reales o 5.D nube).
- **Rama de integración**: `development`. Nunca push directo a `development` ni `master`.

## Bloqueos

- Tablas normativas con `verificado: false` hasta que el usuario las confirme contra la Guía AEA 770 (2017). Ver `npm run norma:pendientes`.
- Corrientes admisibles 2017 (P2) y circuitos mínimos por grado (P3): bloquean dar por cerrada la normativa de la Fase 1.
- Falta el cálculo de corriente de cortocircuito (Icc, P53).

## Decisiones tomadas

- Fuente de verdad normativa: Guía AEA 770, edición 2017; el curso solo como respaldo (P1).
- Un PR por fase hacia `development`, solo cuando el usuario lo pide.

## Cómo actualizar este archivo

Al cerrar una fase: mover lo hecho, anotar el siguiente paso, agregar decisiones nuevas (con el número P de `pendientes.md` si existe) y quitar los bloqueos resueltos. Máximo una pantalla de texto.
