import { expect, test } from "@playwright/test";

test("navegación: barra inferior en móvil, sidebar en desktop", async ({ page }, info) => {
  await page.goto("/calcular");
  const movil = info.project.name.startsWith("movil");
  const nav = page.getByRole("navigation", { name: "Navegación principal" });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Proyectos" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Calcular" })).toHaveAttribute("aria-current", "page");
  if (movil) {
    // Acción central destacada, con área táctil ≥ 44 px.
    const central = page.getByRole("link", { name: "Nuevo cálculo" });
    await expect(central).toBeVisible();
    const caja = await central.boundingBox();
    expect(caja?.width).toBeGreaterThanOrEqual(44);
  } else {
    await expect(page.getByRole("link", { name: "Nuevo cálculo" })).toBeHidden();
    await expect(nav.getByRole("link", { name: "Ajustes" })).toBeVisible();
  }
});

test("al tocar un enlace interno aparece la barra de progreso", async ({ page }) => {
  await page.goto("/calcular", { waitUntil: "networkidle" }); // hidratada: los handlers del cliente ya están puestos
  // Se retienen las peticiones de navegación para que la barra tenga tiempo de verse.
  await page.route("**/*", async (r) => {
    if (r.request().headers()["rsc"]) await new Promise((f) => setTimeout(f, 800));
    await r.continue();
  });
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Presupuesto" }).click();
  await expect(page.locator(".nav-progreso, .nav-progreso-fin")).toHaveCount(1);
  await expect(page).toHaveURL(/\/presupuesto/);
});

test("la barra de progreso y el esqueleto no tapan el contenido: se navega y se llega", async ({ page }) => {
  await page.goto("/calcular");
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("link", { name: "Proyectos" }).click();
  await expect(page).toHaveURL(/\/proyectos/);
  await expect(page.getByRole("heading", { name: "Proyectos" })).toBeVisible();
  await expect(page.getByText("Herramienta de estudio. No reemplaza el criterio profesional")).toBeVisible();
});

test("el cálculo rápido abre con el dato principal enfocado y sigue mostrando el paso a paso", async ({ page }) => {
  await page.goto("/calcular/rapida", { waitUntil: "networkidle" });
  const campo = page.getByLabel("Potencia");
  await expect(campo).toBeFocused();
  await campo.fill("2000");
  await expect(page.getByTestId("resumen")).toContainText("Térmica");
  await page.getByText("Ver cálculo paso a paso").click();
  await expect(page.getByText(/AEA 90364-7-770/).first()).toBeVisible();
});

test("con movimiento reducido no hay animaciones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calcular");
  const animacion = await page.locator("ul.anim-list > li").first().evaluate((el) => getComputedStyle(el).animationName);
  expect(animacion).toBe("none");
});

for (const [ruta, etiqueta] of [
  ["/calcular/caida-tension", "Corriente"],
  ["/calcular/vivienda", "Superficie cubierta"],
  ["/calcular/herramientas/ohm", "Tensión"],
  ["/calcular/herramientas/potencia", "Corriente"],
  ["/calcular/herramientas/consumo", "Potencia del equipo"],
  ["/calcular/herramientas/factor-potencia", "Potencia activa de la carga"],
  ["/calcular/herramientas/fotovoltaico", "Consumo diario"],
] as const) {
  test(`${ruta}: el dato principal arranca enfocado y es grande`, async ({ page }) => {
    await page.goto(ruta);
    const campo = page.getByLabel(etiqueta, { exact: true });
    await expect(campo).toBeFocused();
    const caja = await campo.boundingBox();
    expect(caja?.height).toBeGreaterThanOrEqual(44);
  });
}
