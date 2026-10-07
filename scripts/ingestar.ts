/**
 * Ingesta de la norma para el buscador (RAG) del asistente.
 *
 *   npm run ingestar -- [--carpeta material] [--norma "AEA 90364-7-770"] [--edicion 2017]
 *
 * Lee los .txt/.md y los .pdf de `material/` (no versionado), los parte por artículo y escribe `data/indice-norma.json`
 * (tampoco versionado: el texto de la norma tiene copyright). Los PDF se pasan a texto con `pdftotext -layout`; si un PDF
 * es una imagen (como el Módulo 6) hay que pasarle OCR antes: `ocrmypdf entrada.pdf salida.pdf` y volver a correr.
 * La búsqueda es léxica (BM25): no hace falta clave de ningún proveedor de embeddings.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { partirPorArticulo, type Fragmento } from "../src/integraciones/consulta/servidor/indice";

function arg(nombre: string, porDefecto: string): string {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : porDefecto;
}

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

function textoDe(ruta: string): string | null {
  const ext = extname(ruta).toLowerCase();
  if (ext === ".txt" || ext === ".md") return readFileSync(ruta, "utf8");
  if (ext === ".pdf") {
    try {
      return execFileSync("pdftotext", ["-layout", ruta, "-"], { encoding: "utf8", maxBuffer: 200 * 1024 * 1024 });
    } catch {
      console.warn(`  ! No se pudo leer ${ruta} (¿está instalado pdftotext?).`);
    }
  }
  return null;
}

const carpeta = arg("carpeta", "material");
const norma = arg("norma", "AEA 90364-7-770");
const edicion = arg("edicion", "2017");
let todos: Fragmento[] = [];
try {
  for (const ruta of archivos(carpeta)) {
    const texto = textoDe(ruta);
    if (texto == null) continue;
    if (texto.replace(/\s/g, "").length < 200) {
      console.warn(`  ! ${ruta}: casi no tiene texto. Si es un escaneo, pasale OCR (ocrmypdf) y volvé a correr.`);
      continue;
    }
    const fr = partirPorArticulo(texto, { norma, edicion, documento: basename(ruta) });
    console.log(`  ${ruta}: ${fr.length} fragmentos`);
    todos = todos.concat(fr);
  }
} catch {
  console.error(`No se pudo leer la carpeta "${carpeta}". Poné ahí los PDF/TXT de la norma (no se suben al repo).`);
  process.exit(1);
}
if (todos.length === 0) {
  console.error("No se generó ningún fragmento.");
  process.exit(1);
}
mkdirSync("data", { recursive: true });
writeFileSync("data/indice-norma.json", JSON.stringify(todos));
console.log(`Listo: ${todos.length} fragmentos en data/indice-norma.json`);
