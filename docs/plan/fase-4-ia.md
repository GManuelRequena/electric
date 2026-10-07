# Fase 4: IA (chat con la norma)

## Objetivo
Responder preguntas amplias que requieren razonar con la norma (por ejemplo "¿qué cambia entre un local y una vivienda?" o "¿puedo poner un toma en el baño a X distancia?"). Las respuestas citan el artículo y, si necesitan un número, **llaman a las calculadoras** de las fases 1 y 2 en vez de calcularlo. También permite "revisar mi proyecto con IA".

## Requisitos previos
- Fases 1 a 3 completas.
- Clave de API de Anthropic (Claude) cargada como variable de entorno en Vercel (`ANTHROPIC_API_KEY`). **Nunca en el repo ni en el cliente.**
- Antes de escribir código, leer la documentación vigente de la Claude API (modelos, tool use, prompt caching). Elegir el modelo actual de la familia Sonnet para el chat. Si el agente es Claude Code, usar el skill `claude-api`.

## Alcance
- `ClaudeAsistente implements AsistenteNorma` (la interfaz ya existe desde la Fase 1).
- Índice de búsqueda de la norma y de los módulos (RAG).
- Tools que exponen las funciones de `src/dominio/` al modelo.
- Pantalla de chat en `/consultar`, que mantiene el botón de NotebookLM.
- "Revisar proyecto con IA" en la pestaña Validación.
- Un login mínimo para proteger la API: a partir de esta fase la app tiene un backend con costo.

## Fuera de alcance
- Integración con NotebookLM vía API no oficial. Si algún día existe una API oficial para consumidores, será otra implementación de `AsistenteNorma`.

## Diseño

```ts
// src/integraciones/consulta/AsistenteNorma.ts (ya existe)
export interface AsistenteNorma {
  id: string;
  preguntar(pregunta: string, contexto?: ContextoConsulta): Promise<RespuestaAsistente> | AsyncIterable<FragmentoRespuesta>;
}
export interface RespuestaAsistente { texto: string; citas: Fuente[]; herramientasUsadas: string[] }
```

- **Ruta del servidor** `src/app/api/consultar/route.ts`: recibe la pregunta y el contexto opcional (el proyecto o el cálculo actual), llama a Claude con streaming y devuelve SSE.
- **Tools** (definidas a partir de las firmas del dominio; se ejecutan en el servidor llamando a las funciones puras):
  - `calcular_circuito(EntradaCircuito)` → `ResultadoCircuito`
  - `calcular_vivienda(EntradaVivienda)` → `ResultadoVivienda`
  - `validar_proyecto(Proyecto)` → `Hallazgo[]`
  - `buscar_norma(consulta: string, k?: number)` → fragmentos con `Fuente`
  - `consultar_tabla(id: string, filtro?)` → filas de `src/dominio/normas/**`
- **System prompt** (en español). Reglas:
  - nunca dar valores numéricos normativos sin una tool o un fragmento citado,
  - siempre citar,
  - aclarar cuando algo no está en las fuentes,
  - incluir el aviso legal,
  - responder breve y apto para leer en el celular.
- **RAG**:
  - Script `scripts/ingestar.ts`: lee los PDFs desde `material/` (no versionado) y los parte por artículo o sección.
  - Genera embeddings (Voyage AI u otro proveedor de embeddings) y guarda el índice en Postgres con `pgvector` (Supabase o Neon, plan gratis), o en un archivo local si el corpus es chico.
  - Los textos del índice **no se commitean**.
  - El Módulo 6 requiere OCR previo (por ejemplo `ocrmypdf`).
- **Costos**: prompt caching del system prompt y de las tools, límite de tokens por respuesta, y un contador de uso mensual visible en `/ajustes` con un tope configurable (≤ 20 USD).

## Pantallas
- **`/consultar`**:
  - Chat mobile (input abajo y respuestas con streaming).
  - Chips de citas que se pueden tocar para ver el fragmento.
  - Indicador "usó la calculadora".
  - Botón secundario "Abrir en NotebookLM".
- **Proyecto → Validación → "Revisar con IA"**: le envía el proyecto y los hallazgos, y muestra los comentarios.
- **Login simple** (Supabase Auth con magic link, o una contraseña única en una variable de entorno).

## Tareas
1. Login mínimo + middleware que protege `/api/consultar`.
2. Ingesta: OCR → chunks por artículo → embeddings → índice. Comando `npm run ingestar`.
3. `buscar_norma` y `consultar_tabla`.
4. Ruta `/api/consultar` con tool use + streaming + prompt caching.
5. `ClaudeAsistente` en el cliente y pantalla de chat.
6. "Revisar con IA".
7. Contador de uso y tope mensual.

## Tests y evaluación
- Unit: cada tool ejecuta la función de dominio correcta y valida su entrada.
- **Set de evaluación** `docs/plan/eval-ia.md` o `tests/eval/preguntas.json`:
  - unas 20 preguntas típicas con la respuesta esperada y la cita esperada (el usuario ayuda a escribirlas),
  - script `npm run eval:ia` que las corre e informa si citó bien y si usó la tool cuando debía.
- Verificar que una pregunta numérica ("¿qué térmica para 3500 W?") **siempre** use `calcular_circuito`.

## Criterios de aceptación
- `npm run lint && npm test && npm run build` en verde, y `npm run eval:ia` con ≥ 80% de aciertos.
- Ninguna respuesta con valores normativos sin cita.
- La clave de la API nunca llega al cliente (verificar el bundle).
- El costo de una semana de uso típico es menor a 5 USD.

## Preguntas abiertas
- ¿Supabase o Neon? ¿Login con magic link o contraseña única?
- ¿Proveedor de embeddings?
- Tope de gasto mensual.
- Las ~20 preguntas de evaluación.

## Al terminar
Marcá la Fase 4 en `docs/plan/README.md`, hacé commit y push.
