import { fmt } from "../calculo/util";
import catalogo from "./materiales.json";
import type { ColorConductor, ItemMaterial } from "./tipos";

const ESTATICOS = new Map<string, ItemMaterial>((catalogo.items as ItemMaterial[]).map((i) => [i.codigo, i]));

export const MODULOS_GABINETE = [4, 6, 8, 12, 18, 24, 36, 48] as const;

const NOMBRE_COLOR: Record<ColorConductor, string> = {
  marron: "marrón",
  negro: "negro",
  rojo: "rojo",
  celeste: "celeste",
  verde_amarillo: "verde/amarillo",
};

export const codigoCable = (seccionMm2: number, color: ColorConductor) => `CABLE_UNI_${seccionMm2}_CU_${color.toUpperCase()}`;
export const codigoTermica = (polos: number, curva: string, calibreA: number) => `TERMICA_${polos}P_${curva}${calibreA}`;
export const codigoDiferencial = (polos: number, calibreA: number, sensibilidadMa: number) => `DIF_${polos}P_${calibreA}A_${sensibilidadMa}MA`;
export const codigoGabinete = (modulos: number) => `GABINETE_${modulos}M`;

/** Los ítems con nombre fijo salen del JSON; cables, térmicas, diferenciales y gabinetes se arman desde el código. */
export function itemDeCodigo(codigo: string): ItemMaterial | undefined {
  const fijo = ESTATICOS.get(codigo);
  if (fijo) return fijo;

  const cable = /^CABLE_UNI_(\d+(?:\.\d+)?)_CU_([A-Z_]+)$/.exec(codigo);
  if (cable) {
    const color = cable[2].toLowerCase() as ColorConductor;
    if (!(color in NOMBRE_COLOR)) return undefined;
    return {
      codigo,
      descripcion: `Cable unipolar ${fmt(Number(cable[1]))} mm² Cu (IRAM NM 247-3), ${NOMBRE_COLOR[color]}`,
      unidad: "m",
      categoria: "conductores",
      presentacion: { unidad: "rollo", cantidad: 100 },
    };
  }
  const termica = /^TERMICA_(\d)P_([BCD])(\d+)$/.exec(codigo);
  if (termica) {
    return { codigo, descripcion: `Interruptor termomagnético ${termica[1]}P curva ${termica[2]} ${termica[3]} A`, unidad: "u", categoria: "protecciones" };
  }
  const dif = /^DIF_(\d)P_(\d+)A_(\d+)MA$/.exec(codigo);
  if (dif) {
    return { codigo, descripcion: `Interruptor diferencial ${dif[1]}P ${dif[2]} A ${dif[3]} mA`, unidad: "u", categoria: "protecciones" };
  }
  const gab = /^GABINETE_(\d+)M$/.exec(codigo);
  if (gab) return { codigo, descripcion: `Gabinete para riel DIN de ${gab[1]} módulos`, unidad: "u", categoria: "tablero" };
  return undefined;
}

/** Módulos DIN de 18 mm que ocupa cada protección (1 por polo). */
export const modulosDeProteccion = (polos: number) => polos;

export function gabineteParaModulos(modulos: number): number {
  return MODULOS_GABINETE.find((m) => m >= modulos) ?? Math.ceil(modulos / 12) * 12;
}

export function rollosNecesarios(item: ItemMaterial, cantidad: number): number | undefined {
  return item.presentacion ? Math.ceil(cantidad / item.presentacion.cantidad) : undefined;
}
