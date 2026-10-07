import type { Fuente } from "@/dominio/normas/tipos";

export function Cita({ fuente }: { fuente: Fuente }) {
  return (
    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
      {fuente.norma}, {fuente.referencia}
      {fuente.pagina ? `, pág. ${fuente.pagina}` : ""} · {fuente.documento}
    </span>
  );
}
