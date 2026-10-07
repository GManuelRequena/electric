import { aea770 } from "../src/dominio/normas/aea770";

let total = 0;
for (const t of Object.values(aea770)) {
  const filas = t.filas as { verificado: boolean; fuente: { referencia: string; pagina?: number }; nota?: string }[];
  const pend = filas.filter((f) => !f.verificado);
  if (!t.verificado || pend.length === 0 || filas.length === 0) {
    const vacia = filas.length === 0 ? " (SIN FILAS)" : "";
    console.log(`\n${t.id}${vacia} — ${t.titulo}\n  ${t.fuente.referencia}, pág. ${t.fuente.pagina ?? "?"}${t.nota ? `\n  ${t.nota}` : ""}`);
  }
  for (const f of pend) {
    total++;
    console.log(`  - ${t.id}: ${f.fuente.referencia}, pág. ${f.fuente.pagina ?? "?"}${f.nota ? ` | ${f.nota}` : ""}`);
  }
}
console.log(`\nFilas sin verificar: ${total}`);
