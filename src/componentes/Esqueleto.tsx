/** Bloque gris con brillo que reserva el lugar de lo que está por llegar. Decorativo. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`esqueleto rounded-2xl ${className}`} />;
}

/** Esqueleto de una pantalla típica: título y una lista de tarjetas. */
export function EsqueletoPagina({ tarjetas = 5 }: { tarjetas?: number }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Cargando…</span>
      <Esqueleto className="h-8 w-40" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: tarjetas }, (_, i) => (
          <Esqueleto key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
