import { defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";

// Usa el Chromium preinstalado si existe (sin descargar navegadores).
function chromiumLocal(): string | undefined {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  if (!existsSync(base)) return undefined;
  const dir = readdirSync(base).find((d) => d.startsWith("chromium-"));
  const ruta = dir && `${base}/${dir}/chrome-linux/chrome`;
  return ruta && existsSync(ruta) ? ruta : existsSync(`${base}/chromium`) ? `${base}/chromium` : undefined;
}

const launchOptions = { executablePath: chromiumLocal(), args: ["--no-sandbox"] };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:3100", launchOptions },
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100/calcular",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: [
    { name: "movil-390x844", use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, launchOptions } },
    { name: "desktop-1280x800", use: { viewport: { width: 1280, height: 800 }, launchOptions } },
  ],
});
