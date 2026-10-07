import { expect, test } from "@playwright/test";

test("ley de Ohm calcula con dos datos, muestra el paso a paso y deja el cálculo en el historial", async ({ page }) => {
  await page.goto("/calcular/herramientas/ohm");
  await page.getByLabel("Tensión").fill("12");
  await page.getByLabel("Corriente").fill("2");
  const res = page.getByLabel("Resultado");
  await expect(res).toContainText("6 Ω");
  await expect(res).toContainText("24 W");
  await page.getByText("Ver cálculo paso a paso").click();
  await expect(page.getByText(/no es un valor de la AEA/i)).toBeVisible();

  await page.waitForTimeout(2000); // el historial se anota con un retardo
  await page.goto("/calcular");
  await expect(page.getByLabel("Historial de cálculos").getByText("Ley de Ohm")).toBeVisible();
});

test("compartir como link restaura los campos", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/calcular/herramientas/consumo");
  await page.getByLabel("Potencia del equipo").fill("2000");
  await page.getByLabel("Horas de uso por día").fill("3");
  await page.getByLabel("Tarifa").fill("100");
  await expect(page.getByLabel("Resultado")).toContainText("180");
  await page.getByRole("button", { name: "Compartir como link" }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toContain("/calcular/herramientas/consumo?s=");
  await page.goto(url);
  await expect(page.getByLabel("Potencia del equipo")).toHaveValue("2000");
  await expect(page.getByLabel("Resultado")).toContainText("18.000");
});

test("modo oscuro: se elige en ajustes y persiste al recargar", async ({ page }) => {
  await page.goto("/ajustes");
  await page.getByRole("button", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "oscuro");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "oscuro");
  await page.getByRole("button", { name: "Claro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-tema", "claro");
});

test("plantilla de proyecto: crea la casa de 2 dormitorios con sus ambientes", async ({ page }) => {
  await page.goto("/proyectos");
  await page.getByRole("button", { name: "+ Nuevo proyecto" }).click();
  await page.getByLabel("Nombre").fill("Casa plantilla");
  await page.getByLabel("Plantilla").selectOption({ label: "Casa de 2 dormitorios" });
  await expect(page.getByLabel("Superficie")).toHaveValue("68");
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { name: "Casa plantilla" })).toBeVisible();
  await expect(page.getByText("Dormitorio 2").first()).toBeVisible();
});
