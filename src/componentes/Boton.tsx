import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "peligro";

const ESTILOS: Record<Variante, string> = {
  primario: "bg-amber-500 text-slate-950 active:bg-amber-600",
  secundario: "border border-slate-300 bg-white text-slate-800 active:bg-slate-100",
  peligro: "border border-red-300 bg-white text-red-700 active:bg-red-50",
};

export function Boton({ variante = "primario", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...props}
      className={`min-h-12 rounded-xl px-4 text-base font-semibold disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
    />
  );
}
