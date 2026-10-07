/* Service worker de Electricista: deja las calculadoras disponibles sin conexión. */
const VERSION = "v3";
const CACHE = `electricista-${VERSION}`;
const RUTAS = [
  "/calcular",
  "/calcular/artefactos",
  "/calcular/rapida",
  "/calcular/caida-tension",
  "/calcular/vivienda",
  "/proyectos",
  "/proyectos/ver",
  "/presupuesto",
  "/presupuesto/ver",
  "/presupuesto/informe",
  "/consultar",
  "/ajustes",
  "/ajustes/precios",
  "/ajustes/perfil",
];

// Al instalar: guarda el HTML de cada ruta y todos los archivos /_next/static que referencia.
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const estaticos = new Set(["/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]);
      for (const ruta of RUTAS) {
        try {
          const resp = await fetch(ruta, { credentials: "same-origin" });
          if (!resp.ok) continue;
          await cache.put(ruta, resp.clone());
          const html = await resp.text();
          for (const m of html.matchAll(/\/_next\/static\/[^"'\\\s)]+/g)) estaticos.add(m[0]);
        } catch {
          /* sin red durante la instalación: se completa con el cache en uso */
        }
      }
      await Promise.all(
        [...estaticos].map((u) =>
          fetch(u)
            .then((r) => (r.ok ? cache.put(u, r) : undefined))
            .catch(() => undefined),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(claves.filter((c) => c.startsWith("electricista-") && c !== CACHE).map((c) => caches.delete(c)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Archivos estáticos con hash: cache primero.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon-")) {
    evento.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((resp) => {
            if (resp.ok) caches.open(CACHE).then((c) => c.put(req, resp.clone()));
            return resp;
          }),
      ),
    );
    return;
  }

  // Páginas y datos de navegación: red primero y, sin conexión, lo último guardado.
  evento.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok) caches.open(CACHE).then((c) => c.put(req, resp.clone()));
        return resp;
      })
      .catch(async () => {
        const hit = (await caches.match(req)) || (await caches.match(url.pathname));
        if (hit) return hit;
        if (req.mode === "navigate") return (await caches.match("/calcular")) || Response.error();
        return Response.error();
      }),
  );
});
