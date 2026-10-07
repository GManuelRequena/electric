import Link from "next/link";
import { Pagina } from "@/componentes/Pagina";

const HERRAMIENTAS = [
  { href: "/calcular/herramientas/ohm", titulo: "Ley de Ohm", texto: "Tensión, corriente, resistencia y potencia en continua.", icono: "Ω" },
  { href: "/calcular/herramientas/potencia", titulo: "Potencia en CA", texto: "P, S, Q y corriente, mono o trifásica.", icono: "~" },
  { href: "/calcular/herramientas/consumo", titulo: "Consumo y costo", texto: "kWh por mes y su costo con tu tarifa.", icono: "$" },
  { href: "/calcular/herramientas/factor-potencia", titulo: "Factor de potencia", texto: "kVAr del capacitor para mejorar el cos φ.", icono: "φ" },
  { href: "/calcular/herramientas/fotovoltaico", titulo: "Fotovoltaico básico", texto: "Paneles y banco de baterías, orientativo.", icono: "☀" },
];

export default function Herramientas() {
  return (
    <Pagina titulo="Herramientas" atras="/calcular">
      <ul className="flex flex-col gap-3">
        {HERRAMIENTAS.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-100">
              <span aria-hidden className="w-8 text-center text-3xl">{t.icono}</span>
              <span>
                <span className="block text-lg font-semibold">{t.titulo}</span>
                <span className="block text-sm text-slate-600">{t.texto}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600">Son fórmulas generales de electrotecnia, no valores de la AEA 90364.</p>
    </Pagina>
  );
}
