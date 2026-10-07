import { expect, test, type Page } from "@playwright/test";

async function crearProyecto(page: Page, nombre: string, superficie: string) {
  await page.goto("/proyectos");
  await page.getByRole("button", { name: "+ Nuevo proyecto" }).click();
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Superficie").fill(superficie);
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
}

async function agregarAmbiente(page: Page, tipo: string) {
  await page.getByRole("button", { name: "+ Ambiente" }).click();
  const hoja = page.getByRole("dialog", { name: "Nuevo ambiente" });
  await hoja.getByLabel("Tipo de ambiente").selectOption({ label: tipo });
  await hoja.getByRole("button", { name: "Crear ambiente" }).click();
}

async function agregarElemento(page: Page, ambiente: string, elemento: RegExp, veces = 1) {
  await page.getByRole("button", { name: "+ Agregar elemento" }).click();
  const hoja = page.getByRole("dialog", { name: `Agregar a ${ambiente}` });
  for (let i = 1; i < veces; i++) await hoja.getByRole("button", { name: "Más" }).click();
  await hoja.getByRole("button", { name: elemento }).click();
}

test("vivienda de 2 ambientes: circuitos IUG y TUG separados, hallazgo por falta de tomas y persistencia", async ({ page }) => {
  await crearProyecto(page, "Casa de prueba", "70");

  await agregarAmbiente(page, "Cocina");
  await agregarElemento(page, "Cocina", /Boca de luz/);
  await agregarElemento(page, "Cocina", /Toma general/);
  await agregarAmbiente(page, "Dormitorio");
  await agregarElemento(page, "Dormitorio", /Boca de luz/, 2);
  await agregarElemento(page, "Dormitorio", /Toma general/);

  await page.getByRole("tab", { name: "Circuitos" }).click();
  await expect(page.getByRole("button", { name: /IUG1/ })).toContainText("3 bocas");
  await expect(page.getByRole("button", { name: /TUG1/ })).toContainText("2 bocas");
  await expect(page.getByRole("button", { name: /IUG1/ })).toContainText("mm²");

  await page.getByRole("tab", { name: /Validación/ }).click();
  await expect(page.getByText(/Cocina: falta 1 toma general \(TUG\)/)).toBeVisible();
  await expect(page.getByText(/Tabla 770\.7\.I/).first()).toBeVisible();
  await expect(page.getByText("Se apoya en un valor de la norma sin verificar").first()).toBeVisible();
  await expect(page.getByText("Herramienta de estudio. No reemplaza el criterio profesional")).toBeVisible();

  // Los datos persisten al recargar.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Casa de prueba" })).toBeVisible();
  await page.getByRole("tab", { name: "Circuitos" }).click();
  await expect(page.getByRole("button", { name: /TUG1/ })).toBeVisible();
  await page.goto("/proyectos");
  await expect(page.getByRole("list", { name: "Proyectos guardados" })).toContainText("Casa de prueba");
});

test("circuitos: mover a mano a un circuito nuevo, largo editable y paso a paso", async ({ page }) => {
  await crearProyecto(page, "Mover", "50");
  await agregarAmbiente(page, "Estar / comedor");
  await agregarElemento(page, "Estar / comedor", /Toma general/, 2);

  await page.getByRole("tab", { name: "Circuitos" }).click();
  await page.getByRole("button", { name: /TUG1/ }).click();
  await page.getByLabel("Largo de TUG1").fill("18");
  await expect(page.getByRole("button", { name: /TUG1/ })).toBeVisible();

  await page.getByLabel(/^Mover Toma general de Estar/).first().selectOption({ label: "Circuito nuevo TUG" });
  await expect(page.getByRole("button", { name: /TUG2/ })).toBeVisible();

  await page.getByRole("button", { name: /TUG2/ }).click();
  await expect(page.getByText("manual", { exact: true })).toBeVisible();
  await page.getByText("Ver cálculo paso a paso").first().click();
  await expect(page.getByRole("heading", { name: /Corriente de proyecto/ }).first()).toBeVisible();
});

test("tablero: unifilar con los circuitos y exportación a JSON", async ({ page }) => {
  await crearProyecto(page, "Unifilar", "60");
  await agregarAmbiente(page, "Dormitorio");
  await agregarElemento(page, "Dormitorio", /Boca de luz/);

  await page.getByRole("tab", { name: "Tablero" }).click();
  const svg = page.getByRole("img", { name: "Diagrama unifilar" });
  await expect(svg).toContainText("IUG1");
  await expect(svg).toContainText("Tablero principal");
  await page.getByRole("button", { name: "Acercar" }).click();
  await expect(page.getByText("120 %")).toBeVisible();

  await page.getByRole("button", { name: "Menú del proyecto" }).click();
  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar JSON" }).click()]);
  expect(descarga.suggestedFilename()).toBe("unifilar.json");
});

test("sin conexión: el proyecto guardado se abre y se edita", async ({ page, context }) => {
  await page.goto("/calcular");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(async () => page.evaluate(async () => (await caches.keys()).length > 0 && (await (await caches.open((await caches.keys())[0])).keys()).length > 20), { timeout: 20_000 })
    .toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await crearProyecto(page, "Offline", "45");
  const url = page.url();
  await context.setOffline(true);
  await page.goto(url);
  await expect(page.getByRole("heading", { name: "Offline" })).toBeVisible();
  await agregarAmbiente(page, "Dormitorio");
  await agregarElemento(page, "Dormitorio", /Boca de luz/);
  await page.getByRole("tab", { name: "Circuitos" }).click();
  await expect(page.getByRole("button", { name: /IUG1/ })).toBeVisible();
  await context.setOffline(false);
});
