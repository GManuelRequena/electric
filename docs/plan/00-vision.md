# Visión, decisiones y arquitectura

## Para quién y para qué

- **Usuario**: el dueño del repo, que estudia para Electricista Instalador en Argentina (viviendas por ahora; más adelante locales, edificios, eventos e industria).
- **Uso**: personal. Principalmente desde el **celular**, en la obra o estudiando.
- **Material de referencia**: 8 PDFs del curso (Módulos 1 a 7; el 6 es la reglamentación AEA 90364, escaneada), en Google Drive, carpeta `11vFi1ma2vcENBdrFtXfNHp79D5JUeELO`. Hoy el usuario los consulta en NotebookLM.
- **Presupuesto**: hasta unos 20 USD por mes. Sin IA, la app cuesta casi 0.

## Qué hace la app

1. **Calculadoras** (sin IA):
   - Por artefactos: cargás lo que se usa (en W o A) y la app calcula la corriente, el tipo de circuito, el cable, la térmica y el diferencial.
   - Rápida: cálculo de un circuito suelto.
   - De vivienda: grado de electrificación, circuitos mínimos y bocas por ambiente.
2. **Proyectos**: armás una vivienda por ambientes, eligiendo elementos de un catálogo (luces, teclas, tomas, artefactos). La app **asigna los circuitos según la norma** (IUG, TUG, IUE, TUE, ACU...), los valida y dibuja el unifilar.
3. **Presupuesto**: cómputo de materiales a partir del proyecto, con precios manuales o importados y, más adelante, de proveedores.
4. **Consulta**:
   - Ahora: un botón que abre NotebookLM con la pregunta copiada.
   - Fase 4: chat con IA (Claude) que cita la norma y usa las calculadoras como herramientas.

## Decisiones tomadas (y por qué)

| Decisión | Motivo |
|---|---|
| Cálculos deterministas, sin IA | Un LLM puede inventar valores de tabla. En electricidad eso es peligroso. El código con tests es exacto, gratis y funciona sin conexión. |
| Valores normativos como datos JSON con cita | Se pueden revisar contra el PDF. Sumar otra sección de la norma es sumar datos, no reescribir el motor. |
| Mobile first + PWA offline | El uso real es en el celular, a veces en obras sin señal. |
| Croquis armado con un catálogo (no subir una foto ni dibujar a mano) | Es confiable y rápido, y los datos quedan listos para calcular. Más adelante: plano en grilla. |
| NotebookLM solo como link | No hay API pública para la versión de consumo, y las librerías no oficiales son frágiles y van contra los términos de uso. Queda detrás de la interfaz `AsistenteNorma`. |
| IA en la fase 4 | Primero, una app útil sin IA. Después, la IA para preguntas de razonamiento. |
| Precios detrás de `PriceProvider` | Empieza con precios manuales o CSV. Sumar un proveedor es sumar un archivo. |
| Repo privado y sin PDFs | La norma AEA tiene copyright. |

## Arquitectura

```
                ┌───────────────────────── UI (Next.js, mobile first) ─────────────────────────┐
                │  /calcular        /proyectos        /presupuesto        /consultar           │
                └──────┬───────────────┬──────────────────┬───────────────────┬────────────────┘
                       │               │                  │                   │
             dominio/calculo   dominio/circuitos   dominio/computo   integraciones/consulta
                       │               │                  │            (NotebookLM → IA)
                       └──────┬────────┘                  │
                       dominio/normas/aea770  ◄───────────┘   integraciones/precios (PriceProvider)
                       (tablas JSON con cita)
                       dominio/proyecto  (modelo de datos único, persistido en IndexedDB)
```

- **Una sola fuente de datos**: el `Proyecto`. De ahí salen los cálculos, el unifilar, el presupuesto y, en la fase 4, el contexto para la IA.
- `src/dominio/**` es TypeScript puro: se puede testear y reutilizar (por ejemplo en una app nativa o en las tools de la IA).

## Glosario mínimo

- **Ib**: corriente de proyecto del circuito.
- **In**: corriente nominal de la protección (térmica).
- **Iz**: corriente admisible del conductor según su sección y método de instalación.
- **Condición de protección**: Ib ≤ In ≤ Iz (más la verificación de I2 ≤ 1,45 Iz si la norma lo pide; ver tablas).
- **Grado de electrificación**: mínimo / medio / elevado / superior, según la superficie y la demanda (AEA 770).
- **Tipos de circuito**:
  - IUG: iluminación de uso general.
  - TUG: tomacorrientes de uso general.
  - IUE: iluminación de uso especial.
  - TUE: tomacorrientes de uso especial.
  - Uso específico: ACU, MBTF, etc.
- **Boca**: punto de conexión (luz o toma).

> Todos los valores numéricos concretos se toman del Módulo 6 (AEA 90364) y se verifican. Este glosario no es fuente de valores.
