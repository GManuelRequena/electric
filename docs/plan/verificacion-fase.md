# Verificación al cerrar una fase

Checklist común que se pasa **al terminar cada fase o bloque**, antes de abrir el PR. Complementa los "Criterios de aceptación" propios de cada `fase-N-*.md`: esos dicen qué hace la fase; este comprueba que se respetaron las reglas de `CLAUDE.md`.

Cada punto se marca con evidencia (comando, archivo o captura), no de memoria. Lo que no se pueda comprobar se anota en `estado.md` como pendiente.

## 1. Automático

- [ ] `npm run lint && npm test` en verde.
- [ ] `npm run e2e` y `npm run build` en verde (cuando la fase toca UI).
- [ ] `npm run norma:pendientes` ejecutado: la lista de filas con `verificado: false` no creció sin aviso. Si creció, cada fila nueva está en `pendientes.md`.

## 2. Reglas que nunca se rompen

- [ ] **Valores normativos**: todo valor nuevo en `src/dominio/normas/**` tiene `fuente` (norma, sección, artículo o tabla, página). Lo no verificado lleva `verificado: false` + `PENDIENTE_VERIFICAR`.
- [ ] **Sin valores sueltos**: búsqueda en `src/dominio/calculo`, `circuitos`, `computo` y `src/app` de números de la norma escritos a mano (secciones, calibres, límites, porcentajes). No debe haber ninguno fuera de `normas/**`.
- [ ] **Dominio puro**: `src/dominio/**` no importa React, Next ni APIs del navegador.
- [ ] **Tests**: cada función nueva de `src/dominio/` tiene su `*.test.ts` al lado.
- [ ] **Sin IA en cálculos**: ningún cálculo eléctrico pasa por el modelo.
- [ ] **Sin material con copyright**: no hay PDFs ni texto completo de la norma en el repo (`git status` y `git diff --stat` revisados).

## 3. UI (si la fase toca pantallas)

- [ ] Se ve bien a 390×844 y a 1280×800; botones ≥ 44 px; `inputMode="decimal"` en campos numéricos.
- [ ] Muestra el paso a paso y la cita de la norma en cada resultado.
- [ ] Los valores con `verificado: false` muestran el aviso visible.
- [ ] El aviso legal sigue visible.

## 4. Revisión independiente

- [ ] Se corrió `/code-review` (nivel `high` para código de dominio o normas) en una sesión nueva, o sobre el diff de la rama, y se resolvieron los hallazgos o se justificó por qué no.
- [ ] Revisión adversarial del diff: ¿qué valor podría estar mal copiado? ¿qué caso borde no tiene test?

## 5. Cierre

- [ ] `docs/plan/README.md` marcado.
- [ ] `docs/plan/estado.md` actualizado (fase, decisiones, bloqueos).
- [ ] Datos que solo el usuario puede confirmar contra la Guía AEA agregados al checklist de `pendientes.md`.
- [ ] Commit y push a la rama de trabajo. El PR hacia `development` solo si el usuario lo pide.
