import { expect, test, type Page } from "@playwright/test";

async function agregarDelCatalogo(page: Page, nombre: string) {
  await page.getByRole("button", { name: "+ Agregar artefacto" }).click();
  await page.getByLabel("Buscar artefacto").fill(nombre);
  await page.getByRole("button", { name: new RegExp(nombre) }).first().click();
}

test("por artefactos: agrega 3 artefactos, ve el resultado y abre el paso a paso", async ({ page }) => {
  await page.goto("/calcular/artefactos");
  await page.getByLabel("Largo del circuito (opcional)").fill("10");

  await agregarDelCatalogo(page, "Ducha eléctrica");
  await agregarDelCatalogo(page, "Termotanque eléctrico");
  await agregarDelCatalogo(page, "Heladera");
  await expect(page.getByRole("article")).toHaveCount(3);

  const resumen = page.getByTestId("resumen");
  await expect(resumen).toContainText("Cable");
  await expect(resumen).toContainText("Térmica");
  await expect(resumen).toContainText("Diferencial 30 mA");
  // La ducha y el termotanque piden circuito propio: el resumen marca ⚠.
  await expect(resumen).toContainText("⚠");

  await page.getByText("Ver cálculo paso a paso").click();
  await expect(page.getByRole("heading", { name: /Corriente de proyecto/ })).toBeVisible();
  await expect(page.getByText(/AEA 90364-7-770/).first()).toBeVisible();
  await expect(page.getByLabel("Advertencias").getByText(/sin verificar/i).first()).toBeVisible();
  await expect(page.getByText("Herramienta de estudio. No reemplaza el criterio profesional")).toBeVisible();
});

test("por artefactos: una ducha sola cumple y da 2,5 mm² y 16 A", async ({ page }) => {
  await page.goto("/calcular/artefactos");
  await page.getByLabel("Largo del circuito (opcional)").fill("10");
  await agregarDelCatalogo(page, "Ducha eléctrica");
  const resumen = page.getByTestId("resumen");
  await expect(resumen).toContainText("Cable 2,5 mm²");
  await expect(resumen).toContainText("Térmica 16 A C");
  await expect(resumen).toContainText("✓");
});

test("caída de tensión: ducha a 55 m propone 4 mm²", async ({ page }) => {
  await page.goto("/calcular/caida-tension");
  await page.getByRole("button", { name: "Sección", exact: true }).click();
  await page.getByLabel("Corriente", { exact: true }).fill("15,909");
  await page.getByLabel("Largo del tramo (ida)").fill("55");
  // Con el límite de iluminación (3 %, el primero) hacen falta 6 mm²; para otras cargas (5 %) alcanzan 4 mm².
  await expect(page.getByTestId("resultado-caida")).toContainText("Sección mínima: 6 mm²");
  await page.getByText("Tensión, material y límite").click();
  await page.getByLabel("Tipo de tramo / carga").selectOption({ label: "Otras cargas, servicio normal (5 %)" });
  await expect(page.getByTestId("resultado-caida")).toContainText("Sección mínima: 4 mm²");
});

test("vivienda: 96 m² es grado medio", async ({ page }) => {
  await page.goto("/calcular/vivienda");
  await page.getByLabel("Superficie cubierta").fill("94");
  await page.getByLabel("Superficie semicubierta (opcional)").fill("4");
  await expect(page.getByTestId("resultado-vivienda")).toContainText("Grado MEDIO");
});

test("rápida: 2200 W → 10 A, 2,5 mm²", async ({ page }) => {
  await page.goto("/calcular/rapida");
  await page.getByLabel("Potencia", { exact: true }).fill("2200");
  await expect(page.getByTestId("resumen")).toContainText("Cable 2,5 mm²");
});

test("sin scroll horizontal y botones de al menos 44 px", async ({ page }) => {
  for (const ruta of ["/calcular", "/calcular/artefactos", "/calcular/rapida", "/calcular/caida-tension", "/calcular/vivienda", "/ajustes"]) {
    await page.goto(ruta);
    const ancho = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, cliente: document.documentElement.clientWidth }));
    expect(ancho.scroll, `scroll horizontal en ${ruta}`).toBeLessThanOrEqual(ancho.cliente);
    const chicos = await page.evaluate(() =>
      [...document.querySelectorAll("button, a[href], summary")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && r.height < 43.5;
        })
        .map((el) => `${el.tagName} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().height)}px`),
    );
    expect(chicos, `elementos táctiles bajos en ${ruta}`).toEqual([]);
  }
});

test("el botón de NotebookLM copia la pregunta y abre el notebook", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.goto("/calcular/rapida");
  await page.getByLabel("Potencia", { exact: true }).fill("2200");
  const popup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Consultar en NotebookLM" }).click();
  expect((await popup).url()).toContain("notebook");
});

test("PWA: manifest e instalable y funciona sin conexión", async ({ page, context }) => {
  const manifest = await (await page.request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toBe("Electricista");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));

  await page.goto("/calcular");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Espera a que la instalación termine de guardar las rutas.
  await expect
    .poll(async () => page.evaluate(async () => (await caches.keys()).length > 0 && (await (await caches.open((await caches.keys())[0])).keys()).length > 20), { timeout: 20_000 })
    .toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  for (const ruta of ["/calcular/rapida", "/calcular/artefactos", "/calcular/caida-tension", "/calcular/vivienda"]) {
    await page.goto(ruta);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.goto("/calcular/rapida");
  await page.getByLabel("Potencia", { exact: true }).fill("2200");
  await expect(page.getByTestId("resumen")).toContainText("Cable 2,5 mm²");
  await context.setOffline(false);
});
