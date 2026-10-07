import { expect, test } from "@playwright/test";

test("plano: ubicar tablero y boca, el largo del circuito sale del plano y se puede arrastrar", async ({ page }) => {
  await page.goto("/proyectos");
  await page.getByRole("button", { name: "+ Nuevo proyecto" }).click();
  await page.getByLabel("Nombre").fill("Con plano");
  await page.getByLabel("Superficie").fill("40");
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await page.getByRole("button", { name: "+ Ambiente" }).click();
  const hoja = page.getByRole("dialog", { name: "Nuevo ambiente" });
  await hoja.getByLabel("Tipo de ambiente").selectOption({ label: "Dormitorio" });
  await hoja.getByRole("button", { name: "Crear ambiente" }).click();
  await page.getByRole("button", { name: "+ Agregar elemento" }).click();
  await page.getByRole("dialog", { name: /Agregar a/ }).getByRole("button", { name: /Boca de luz/ }).click();

  await page.getByRole("tab", { name: "Plano" }).click();
  await page.getByRole("button", { name: "+ Ambiente al plano" }).click();
  await page.getByRole("dialog", { name: "Agregar ambiente al plano" }).getByRole("button", { name: /Dormitorio/ }).click();
  await expect(page.getByRole("region", { name: "Objeto seleccionado" })).toBeVisible();

  const lienzo = page.getByTestId("plano");
  // Vista inicial: 40 px por metro con origen en (−1, −1) m. La página puede scrollear: se mide cada vez.
  const en = async (xM: number, yM: number) => {
    const caja = (await lienzo.boundingBox())!;
    return { x: caja.x + (xM + 1) * 40, y: caja.y + (yM + 1) * 40 };
  };

  await page.getByRole("button", { name: "Ubicar tablero" }).click();
  await lienzo.scrollIntoViewIfNeeded();
  const t = await en(1, 1);
  await page.mouse.click(t.x, t.y);
  await page.getByRole("button", { name: /Boca de luz · Dormitorio/ }).click();
  await lienzo.scrollIntoViewIfNeeded();
  const b = await en(4, 3);
  await page.mouse.click(b.x, b.y);

  // 3 m en horizontal + 2 m en vertical + 1,1 m de subida (tablero a 1,5 m, luz a 2,6 m).
  await expect(page.getByRole("region", { name: "Largos desde el plano" })).toContainText("6,1 m desde plano");

  // Arrastrar la boca 1 m a la derecha suma 1 m.
  const desde = await en(4, 3);
  const hasta = await en(5, 3);
  await page.mouse.move(desde.x, desde.y);
  await page.mouse.down();
  await page.mouse.move((desde.x + hasta.x) / 2, hasta.y, { steps: 3 });
  await page.mouse.move(hasta.x, hasta.y, { steps: 3 });
  await page.mouse.up();
  await expect(page.getByRole("region", { name: "Largos desde el plano" })).toContainText("7,1 m desde plano");

  await page.getByRole("tab", { name: "Circuitos" }).click();
  await page.getByRole("button", { name: /IUG1/ }).click();
  await expect(page.getByText("desde plano", { exact: true })).toBeVisible();

  // Persiste al recargar.
  await page.reload();
  await page.getByRole("tab", { name: "Plano" }).click();
  await expect(page.getByRole("region", { name: "Largos desde el plano" })).toContainText("7,1 m desde plano");
});
