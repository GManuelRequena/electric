# Plan de implementación

Documentos para que un agente (por ejemplo Claude Sonnet en Claude Code) construya la app fase por fase.

## Cómo usarlo

Para cada fase, abrí una sesión nueva y pedí:

> Leé `CLAUDE.md`, `docs/plan/00-vision.md` y `docs/plan/fase-N-xxx.md` y ejecutá la fase. Hacé las preguntas abiertas antes de empezar.

Una fase por sesión. Revisá el resultado en el celular antes de pasar a la siguiente.

## Orden y estado

- [x] [Fase 0: Corpus y tablas de la norma](fase-0-corpus.md)
- [x] [Fase 1: Calculadoras + PWA](fase-1-calculadoras.md)
- [x] [Fase 2: Proyectos con catálogo y circuitos según la norma](fase-2-proyectos.md)
- [x] [Fase 3: Presupuesto de materiales](fase-3-presupuesto.md)
- [x] [Fase 4: IA (chat con la norma)](fase-4-ia.md)
- [ ] [Fase 5: Extras y escalado](fase-5-extras.md)
  - [x] 5.A Plano en grilla
  - [ ] 5.B Otras secciones de la norma
  - [ ] 5.C Proveedor de precios real
  - [ ] 5.D Nube y multiusuario
  - [x] 5.E Herramientas extra (Ohm, potencia CA, consumo y costo, factor de potencia, fotovoltaico; falta Icc, ver P53)
  - [x] 5.F Calidad de vida (modo oscuro, compartir por link, historial, plantillas)

> Fase 0: estructura y loaders completos; varias tablas quedan parciales o `verificado: false` (ver `npm run norma:pendientes`).

Las fases 0 y 1 se pueden solapar: la 1 puede arrancar con las tablas marcadas `verificado: false` mientras la 0 las completa.

Pendientes de la Fase 0: [pendientes.md](pendientes.md)

## Visión general

[00-vision.md](00-vision.md)

## Referencias

- [Análisis de "Calculadora Eléctrica Pro"](referencia-calculadora-pro.md): funciones, estructura del informe y errores a evitar.
