/** Falla si algo parecido a una clave de API o el nombre de la variable aparece en lo que se manda al navegador (.next/static). */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? archivos(join(dir, n)) : [join(dir, n)]));
}
const malos = archivos(".next/static")
  .filter((f) => /\.(js|css|html|json|map)$/.test(f))
  .filter((f) => /sk-ant-|ANTHROPIC_API_KEY|APP_PASSWORD|SESSION_SECRET/.test(readFileSync(f, "utf8")));
if (malos.length) {
  console.error("Posible filtración al cliente en:\n" + malos.join("\n"));
  process.exit(1);
}
console.log("OK: ni la clave ni las variables secretas aparecen en el bundle del cliente.");
