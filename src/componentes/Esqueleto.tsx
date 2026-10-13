/** Bloque gris con brillo que reserva el lugar de lo que está por llegar. Decorativo. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`esqueleto rounded-2xl ${className}`} />;
}

/** Pila de tarjetas-esqueleto con la altura de las tarjetas reales (clase Tailwind, por ejemplo "h-16"). */
export function EsqueletoTarjetas({ cantidad = 3, alto = "h-24" }: { cantidad?: number; alto?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: cantidad }, (_, i) => (
        <Esqueleto key={i} className={alto} />
      ))}
    </div>
  );
}

/** Esqueleto de una pantalla típica: título, lista de tarjetas y, opcionalmente, botones al pie. */
export function EsqueletoPagina({ tarjetas = 5, alto = "h-24", botones = 0 }: { tarjetas?: number; alto?: string; botones?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Cargando…</span>
      <Esqueleto className="h-8 w-40" />
      <EsqueletoTarjetas cantidad={tarjetas} alto={alto} />
      {Array.from({ length: botones }, (_, i) => (
        <Esqueleto key={i} className="h-12 rounded-xl" />
      ))}
    </div>
  );
}
