/**
 * Evaluación del asistente: corre las preguntas de tests/eval/preguntas.json contra la API real (gasta tokens) e informa
 * si usó la herramienta que correspondía, si citó y si el número coincide con el de la función del dominio.
 *
 *   ANTHROPIC_API_KEY=... npm run eval:ia
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { calcularCircuito, metodosDisponibles, type EntradaCircuito } from "../src/dominio/calculo";
import { ejecutarAgente, type EventoAgente } from "../src/integraciones/consulta/servidor/agente";

interface Pregunta {
  id: string;
  pregunta: string;
  herramientas: string[];
  citar: boolean;
  contiene?: string[];
  calculo?: { entrada: Partial<EntradaCircuito>; campo: "termicaA" | "seccionMm2" | "corrienteProyectoA" };
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Falta ANTHROPIC_API_KEY.");
  process.exit(2);
}
const { preguntas } = JSON.parse(readFileSync("tests/eval/preguntas.json", "utf8")) as { preguntas: Pregunta[] };
const cliente = new Anthropic();
const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
let aciertos = 0;

for (const p of preguntas) {
  let texto = "";
  let usadas: string[] = [];
  let citas = 0;
  let costo = 0;
  let error = "";
  await ejecutarAgente({
    cliente,
    historial: [],
    pregunta: p.pregunta,
    onEvento: (e: EventoAgente) => {
      if (e.tipo === "texto") texto += e.texto;
      else if (e.tipo === "citas") citas = e.citas.length;
      else if (e.tipo === "fin") {
        usadas = e.herramientasUsadas;
        costo = e.costoUsd;
      }
      else if (e.tipo === "error") error = e.mensaje;
    },
  });
  const fallos: string[] = [];
  if (error) fallos.push(`error: ${error}`);
  if (p.herramientas.length && !p.herramientas.some((h) => usadas.includes(h))) fallos.push(`no usó ${p.herramientas.join(" / ")} (usó: ${usadas.join(", ") || "ninguna"})`);
  if (p.citar && citas === 0) fallos.push("no citó");
  for (const c of p.contiene ?? []) if (!normalizar(texto).includes(normalizar(c))) fallos.push(`falta "${c}"`);
  if (p.calculo) {
    const e = { sistema: "monofasico", tensionV: 220, material: "cobre", metodoInstalacion: metodosDisponibles()[0], ...p.calculo.entrada } as EntradaCircuito;
    const esperado = String(calcularCircuito(e)[p.calculo.campo]).replace(".", ",");
    if (!texto.replace(/\./g, "").replace(".", ",").includes(esperado)) fallos.push(`no aparece el valor del dominio (${p.calculo.campo} = ${esperado})`);
  }
  if (fallos.length === 0) aciertos++;
  console.log(`${fallos.length === 0 ? "✓" : "✗"} ${p.id} (${costo.toFixed(4)} USD)${fallos.length ? "\n    " + fallos.join("\n    ") : ""}`);
}
const pct = (100 * aciertos) / preguntas.length;
console.log(`\n${aciertos}/${preguntas.length} aciertos (${pct.toFixed(0)} %). Objetivo: ≥ 80 %.`);
process.exit(pct >= 80 ? 0 : 1);
