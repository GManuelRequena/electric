import { expect, test, type Page } from "@playwright/test";

const sse = (...evs: object[]) => evs.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
const fuente = { norma: "AEA 90364-7-770", edicion: "2017", referencia: "Tabla de prueba", documento: "MODULO_6.pdf", pagina: 12 };
const RESPUESTA = sse(
  { tipo: "herramienta", nombre: "calcular_circuito" },
  { tipo: "texto", texto: "Va una térmica de 25 A." },
  { tipo: "citas", citas: [{ fuente, texto: "Texto del fragmento citado.", verificado: false }] },
  { tipo: "fin", herramientasUsadas: ["calcular_circuito"], uso: {}, costoUsd: 0.01 },
);

async function mockIA(page: Page) {
  await page.route("**/api/consultar", (r) => r.fulfill({ status: 200, contentType: "text/event-stream", body: RESPUESTA }));
}

test("la API del asistente exige sesión y el login valida la contraseña", async ({ request, page }) => {
  expect((await request.post("/api/consultar", { data: { pregunta: "hola" } })).status()).toBe(401);
  expect((await request.get("/api/uso")).status()).toBe(401);

  await page.goto("/login");
  await page.getByLabel("Contraseña").fill("mala");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Contraseña incorrecta.")).toBeVisible();

  await page.getByLabel("Contraseña").fill("clave-e2e");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/consultar/);

  // Con sesión pasa el proxy; el servidor de prueba no tiene clave de Claude y lo dice.
  const r = await page.request.post("/api/consultar", { data: { pregunta: "hola" } });
  expect(r.status()).toBe(503);
  expect((await r.json()).error).toContain("ANTHROPIC_API_KEY");
});

test("chat: respuesta con streaming, indicador de calculadora y cita tocable", async ({ page }) => {
  await mockIA(page);
  await page.goto("/consultar");
  await page.getByLabel("Pregunta", { exact: true }).fill("¿Qué térmica va para 3500 W?");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Va una térmica de 25 A.")).toBeVisible();
  await expect(page.getByText("Usó la calculadora")).toBeVisible();
  await page.getByRole("button", { name: /Tabla de prueba/ }).click();
  await expect(page.getByText("Texto del fragmento citado.")).toBeVisible();
  await expect(page.getByText(/sin verificar/)).toBeVisible();
  await expect(page.getByText("Herramienta de estudio. No reemplaza el criterio profesional")).toBeVisible();
  // El botón de NotebookLM sigue disponible.
  await page.getByRole("button", { name: /Abrir en NotebookLM/ }).click();
  await expect(page.getByRole("button", { name: "Consultar en NotebookLM" })).toBeVisible();
});

test("sin sesión el chat muestra el link para iniciar sesión", async ({ page }) => {
  await page.route("**/api/consultar", (r) => r.fulfill({ status: 401, json: { error: "Iniciá sesión para usar el asistente." } }));
  await page.goto("/consultar");
  await page.getByLabel("Pregunta", { exact: true }).fill("hola");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
});

test("Revisar con IA: manda el proyecto y muestra los comentarios", async ({ page }) => {
  let cuerpo = "";
  await page.route("**/api/consultar", (r) => {
    cuerpo = r.request().postData() ?? "";
    return r.fulfill({ status: 200, contentType: "text/event-stream", body: RESPUESTA });
  });
  await page.goto("/proyectos");
  await page.getByRole("button", { name: "+ Nuevo proyecto" }).click();
  await page.getByLabel("Nombre").fill("Casa IA");
  await page.getByLabel("Superficie").fill("70");
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await page.getByRole("tab", { name: /Validación/ }).click();
  await page.getByRole("button", { name: "Revisar con IA" }).click();
  await expect(page.getByText("Va una térmica de 25 A.")).toBeVisible();
  expect(cuerpo).toContain("Casa IA");
  expect(cuerpo).toContain("Hallazgos del validador");
});
