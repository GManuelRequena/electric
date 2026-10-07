import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AvisoLegal } from "@/componentes/AvisoLegal";
import { NavInferior } from "@/componentes/NavInferior";
import { RegistrarSW } from "@/componentes/RegistrarSW";

export const metadata: Metadata = {
  title: "Electricista",
  description: "Calculadoras de circuitos según AEA 90364 (viviendas). Herramienta de estudio.",
  applicationName: "Electricista",
  appleWebApp: { capable: true, title: "Electricista", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f59e0b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <main className="mx-auto min-h-dvh max-w-2xl px-4 pt-4 pb-40">
          {children}
          <AvisoLegal />
        </main>
        <NavInferior />
        <RegistrarSW />
      </body>
    </html>
  );
}
