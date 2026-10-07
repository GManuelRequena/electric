import { expect, test, type Page } from "@playwright/test";

async function crearProyectoConCircuitos(page: Page, nombre: string) {
  await page.goto("/proyectos");
  await page.getByRole("button", { name: "+ Nuevo proyecto" }).click();
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByLabel("Superficie").fill("70");
  await page.getByRole("button", { name: "Crear proyecto" }).click();
  await expect(page.getByRole("heading", { name: nombre })).toBeVisible();
  await page.getByRole("button", { name: "+ Ambiente" }).click();
  const hoja = page.getByRole("dialog", { name: "Nuevo ambiente" });
  await hoja.getByLabel("Tipo de ambiente").selectOption({ label: "Dormitorio" });
  await hoja.getByRole("button", { name: "Crear ambiente" }).click();
  await page.getByRole("button", { name: "+ Agregar elemento" }).click();
  const agregar = page.getByRole("dialog", { name: "Agregar a Dormitorio" });
  await agregar.getByRole("button", { name: /Boca de luz/ }).click();
  await page.getByRole("button", { name: "+ Agregar elemento" }).click();
  await page.getByRole("dialog", { name: "Agregar a Dormitorio" }).getByRole("button", { name: /Toma general/ }).click();
  await page.getByRole("tab", { name: "Circuitos" }).click();
  await expect(page.getByRole("button", { name: /IUG1/ })).toBeVisible();
}

test("proyecto → presupuesto → cargar 2 precios → el total se actualiza → exportar", async ({ page }) => {
  await crearProyectoConCircuitos(page, "Casa del presupuesto");

  await page.goto("/presupuesto");
  await page.getByRole("link", { name: /Casa del presupuesto/ }).click();
  await expect(page.getByRole("heading", { name: /Presupuesto: Casa del presupuesto/ })).toBeVisible();
  await expect(page.getByText(/ítems sin precio/)).toBeVisible();
  await expect(page.getByTestId("total")).toContainText("0,00");
  await expect(page.getByText("estimado").first()).toBeVisible();

  await page.getByLabel("Precio unitario JABALINA").fill("5000");
  await expect(page.getByTestId("total")).toContainText("5.000,00");
  await page.getByLabel("Precio unitario CAJA_OCTOGONAL").fill("300");
  await expect(page.getByTestId("total")).toContainText("5.300,00");

  // Mano de obra por boca: 1 boca de luz + 1 toma = 2 bocas.
  await page.getByRole("button", { name: "Por boca" }).click();
  await page.getByLabel("Valor por boca").fill("1000");
  await expect(page.getByTestId("total")).toContainText("7.300,00");

  // Los precios y la mano de obra persisten.
  await page.reload();
  await expect(page.getByTestId("total")).toContainText("7.300,00");

  const descarga = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar Excel" }).click();
  expect((await descarga).suggestedFilename()).toMatch(/^presupuesto-casa-del-presupuesto\.xlsx$/);

  // Informe: versión cliente y técnica, con el presupuesto.
  await page.getByRole("link", { name: /Exportar PDF/ }).click();
  const informe = page.getByRole("article", { name: "Informe" });
  await expect(informe.getByRole("heading", { name: "Informe de instalación eléctrica" })).toBeVisible();
  await expect(informe.getByText("Presupuesto", { exact: true })).toBeVisible();
  await expect(informe.getByText("Herramienta de estudio. No reemplaza el criterio profesional")).toBeVisible();
  await page.getByRole("button", { name: "Técnica" }).click();
  await expect(informe.getByRole("heading", { name: "Informe técnico de instalación eléctrica" })).toBeVisible();
  await expect(informe.getByText("Ficha por circuito")).toBeVisible();
  await expect(informe.getByText(/Tabla 770/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Imprimir o guardar como PDF" })).toBeVisible();
});

test("lista de precios: importar CSV rechaza las filas inválidas y reporta cuáles", async ({ page }) => {
  await page.goto("/ajustes/precios");
  const csv = "codigo,precio,moneda,fecha,proveedor\nJABALINA,18000,ARS,2026-10-01,Casa Pérez\nNO_EXISTE,5,ARS,,\nTAPA,abc,ARS,,\n";
  await page.getByLabel("Archivo de precios").setInputFiles({ name: "precios.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.getByRole("status")).toContainText("1 precio importado, 2 filas rechazadas");
  await expect(page.getByRole("list", { name: "Filas rechazadas" })).toContainText("Fila 3");
  await expect(page.getByRole("list", { name: "Filas rechazadas" })).toContainText("Fila 4");
  await expect(page.getByText("JABALINA · Casa Pérez · 2026-10-01")).toBeVisible();
});

test("perfil del instalador: sus datos aparecen en la carátula del informe", async ({ page }) => {
  await page.goto("/ajustes/perfil");
  await page.getByLabel("Nombre y apellido").fill("Juan Pérez");
  await page.getByLabel("Matrícula").fill("12345");
  await crearProyectoConCircuitos(page, "Obra con perfil");
  await page.goto("/presupuesto");
  await page.getByRole("link", { name: /Obra con perfil/ }).click();
  await page.getByRole("link", { name: /Exportar PDF/ }).click();
  await expect(page.getByRole("article", { name: "Informe" })).toContainText("Juan Pérez · Mat. 12345");
});
