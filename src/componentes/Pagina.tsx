import Link from "next/link";

export function Pagina({ titulo, atras, children }: { titulo: string; atras?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        {atras && (
          <Link href={atras} aria-label="Volver" className="flex size-11 items-center justify-center rounded-lg text-2xl text-slate-600">
            ‹
          </Link>
        )}
        <h1 className="text-2xl font-bold">{titulo}</h1>
      </header>
      {children}
    </div>
  );
}
