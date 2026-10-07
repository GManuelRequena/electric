# Ejercicios resueltos del curso (para tests)

Lista de ejercicios resueltos de los Módulos 1 a 7 que sirven para verificar las calculadoras.
Cuando aparezca uno, agregalo acá y pedile al agente que lo convierta en un test.

| Módulo | Página | Tema | Resultado esperado | ¿Ya es test? |
|---|---|---|---|---|
| 4 | ~326 | Vivienda: iluminación 1350 VA × 0,66 | 891 VA | No |
| 4 | ~326 | Vivienda: demanda total (891 + 4400 TUG + 3300 TUE) | 8591 VA | No |
| 4 | ~339-340 | Vivienda tipo: 1386 + 4400 + 6600 | 12386 VA | No |
| 4 | ~340 | 20 viviendas con simultaneidad 50 % | 123860 VA | No |
| 4 | ~342 | Ip circuito de alumbrado: 577,5 VA / 220 V | 2,63 A | No |
| 4 | ~342 | Ip circuito TUG: 2200 VA / 220 V | 10 A | No |
| 4 | ~342 | Ip circuito TUE: 2750 VA / 220 V | 12,5 A | No |
| 4 | ~342 | Ip línea seccional: 11055 VA / 220 V; 10 mm² (43 A × 1,22) | 50,25 A; Iz 52,5 A, válido | No |

> Estos ejercicios usan criterios del curso (150 VA por boca, 66 %), no de la Guía AEA 770 2017 (60 VA por boca, 2/3). Decisión (P1 en `pendientes.md`): la Guía 2017 manda, así que no se usan como tests tal cual; se recalculan con los criterios de la Guía. Las páginas son aproximadas (número impreso del Manual).
