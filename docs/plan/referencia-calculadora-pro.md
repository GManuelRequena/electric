# Referencia: "Calculadora Eléctrica Pro v3.0" (hazclickpro)

Análisis de https://calculadoraelectrica.hazclickpro.com/ (revisado el 2026-10-07) para tomar ideas. **No copiar código ni diseño**: es un producto comercial. Se revisaron la landing, la demo interactiva, su código JS público y las 7 páginas del PDF de muestra. La app completa es paga (Hotmart, 17,90 USD) y no se probó.

## Qué ofrece

| Función | Detalle | ¿La incorporamos? | Dónde |
|---|---|---|---|
| Múltiples circuitos por proyecto | cocina, baño, iluminación, tomas especiales, bombas | Sí (ya previsto) | Fase 2 |
| Corriente con FD y FS | factor de demanda + factor de seguridad 1.0 / 1.25 / 1.6 | **Parcial**: usamos los coeficientes de simultaneidad de la AEA. El FS 1.25 es un criterio NEC; solo como "reserva" opcional y desactivada por defecto | Fase 1 |
| Termomagnética | calibres comerciales 10–125 A | Sí, desde `calibres-normalizados.json` | Fase 1 |
| Conductor | mm² + AWG, 1,5 a 50 mm² | Sí, con mm² (AWG opcional como dato informativo) | Fase 1 |
| Caída de tensión por distancia | **semáforo**: verde ≤ 3%, naranja 3–5%, rojo > 5% | Sí: semáforo con los **límites de la AEA** (de `caida-tension.json`), no fijos | Fase 1 |
| Curva B / C / D | según el tipo de carga (resistiva, motores, transformadores) | Sí: sugerencia automática + elección manual | Fase 1 |
| Diferencial | 30 mA / 300 mA según el ambiente | Sí, según la norma | Fase 1 |
| Capacidad de corte (kA) | aparece en el informe (6 kA) | Sí, como dato de la protección (configurable) | Fase 1 / 3 |
| Metros / pies | preferencia de unidades | No hace falta (Argentina usa metros) | — |
| Ley de Ohm, cortocircuito (Icc), consumo energético en moneda local, corrección del factor de potencia, fotovoltaico | módulos avanzados | Sí, como **herramientas extra** | Fase 5 (el consumo energético también entra en el informe, Fase 3) |
| PWA instalable | sí | Sí (ya previsto) | Fase 1 |
| Memoria técnica en PDF | ver abajo | Sí | Fase 3 |

## Estructura del PDF de muestra ("Memoria de cálculo y diseño eléctrico")

1. **Carátula**:
   - cliente, n° de obra o informe, dirección, ciudad,
   - electricista o empresa, matrícula, normativa aplicada, fecha,
   - logo o foto.
2. **Objeto y alcance**: un texto estándar sobre qué se verificó y con qué criterios.
3. **Resumen ejecutivo**: potencia total instalada, corriente estimada en el tablero y cantidad de circuitos.
4. **Ficha por circuito** (una página cada una). El encabezado lleva tensión, longitud, FD y FS.
   - A. Cuadro de cargas: artefacto, potencia unitaria, cantidad, subtotal. Totales: P nominal, P corregida, In, I de diseño.
   - B. Tres tarjetas: termomagnética (A, curva, kA), conductor (sección, caída V y %, aislamiento, configuración F+N+T) y diferencial (A, mA, clase).
   - C. **Unifilar individual**: tablero → térmica → cable (sección, L, caída) → carga.
5. **Cuadro consolidado**: una fila por circuito con tensión, potencia, corriente, térmica, conductor, caída y estado (OK / Revisar).
6. **Despiece de materiales**:
   - conductores por sección: distancia lineal → metros de fase, neutro y tierra con **15% de merma** → total,
   - lista de protecciones con sus cantidades.
7. **Consumo energético** diario, mensual y anual en kWh y su costo, con una tarifa de referencia.
8. **Observaciones** (texto libre).
9. **Firmas**: cliente (nombre, documento, fecha) y electricista responsable (nombre, matrícula, norma).

Pie de página en cada hoja con obra, cliente y número de página.

## Errores que encontramos y que nuestra app NO debe repetir

Detectados en la demo pública y en el PDF de muestra:

1. **La caída de tensión de la demo no depende de la sección del cable**: usa `2·L·I·0,9 / (336·V)`. Nuestra fórmula tiene que incluir la sección, la resistividad del material y el cos φ: ΔU = 2·L·I·(ρ/S)·cos φ en monofásico, √3·L·I·(ρ/S)·cos φ en trifásico. Si el curso usa además la reactancia, se agrega. Hay que usar la fórmula exacta del curso.
2. **El conductor sale del calibre de la térmica por tramos fijos**, no de Iz según el método de instalación ni de la caída. Nosotros elegimos la sección como el máximo entre la mínima de la norma, la que da Iz ≥ In y la que cumple la caída.
3. **Detecta caída > 3% pero no corrige**: en el PDF, la ducha de 3500 W a 55 m queda en 2,5 mm² con 5,11% marcado "EXCEDIDO". Nosotros **proponemos automáticamente la sección que cumple** (y mostramos ambas opciones).
4. **cos φ 0,9 fijo** incluso para cargas resistivas (ducha). Nosotros usamos el cos φ de cada artefacto (1 para resistivas).
5. **Normativa genérica** (RETIE / IEC / NEC) y límites fijos de 3% y 5%. Nosotros citamos la AEA 90364 con artículo y tabla.
6. **Un diferencial por circuito** sin criterio explícito. Nosotros seguimos lo que diga la norma y el esquema del tablero (agrupamiento de circuitos bajo cada diferencial).
7. Hay inconsistencias mm² ↔ AWG (10 mm² y 6 mm² aparecen los dos como "8 AWG"). Si mostramos AWG, que salga de una tabla verificada.

## Qué cambia en nuestro plan

- **Fase 1**:
  - semáforo de caída con los límites de la AEA,
  - sugerencia de curva B/C/D según el tipo de carga,
  - kA de la protección,
  - autoajuste de la sección cuando no cumple la caída,
  - "reserva" opcional (no el FS 1.25 por defecto),
  - calculadora dedicada de caída de tensión (ya agregada).
- **Fase 3**: el informe adopta la estructura de arriba (carátula, alcance, resumen, ficha y unifilar por circuito, consolidado, despiece con merma configurable, consumo energético en ARS, observaciones y firmas), con la imagen de la firma, el logo y las citas a la AEA.
- **Fase 5**: herramientas extra (Ley de Ohm, Icc, consumo, factor de potencia, fotovoltaico).
