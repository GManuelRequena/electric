import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/** USD por millón de tokens de claude-sonnet-5-5 (precios publicados al 2026-10-06; PENDIENTE_VERIFICAR contra la facturación real). */
export const PRECIOS_USD_POR_MTOK = { entrada: 2, lecturaCache: 0.2, escrituraCache: 2.5, salida: 10 } as const;

export interface UsoTokens {
  entrada: number;
  lecturaCache: number;
  escrituraCache: number;
  salida: number;
}

export function costoUsd(u: UsoTokens): number {
  const p = PRECIOS_USD_POR_MTOK;
  return (u.entrada * p.entrada + u.lecturaCache * p.lecturaCache + u.escrituraCache * p.escrituraCache + u.salida * p.salida) / 1_000_000;
}

export interface UsoMensual {
  mes: string; // "2026-10"
  usd: number;
  consultas: number;
}

export interface AlmacenUso {
  leer(mes: string): UsoMensual;
  sumar(mes: string, usd: number): UsoMensual;
}

export const mesDe = (fecha = new Date()) => fecha.toISOString().slice(0, 7);

/** Archivo JSON local. En Vercel el disco no persiste: hay que cambiarlo por KV/Postgres (ver pendientes). */
export class AlmacenUsoArchivo implements AlmacenUso {
  constructor(private readonly ruta = process.env.USO_ARCHIVO ?? join(tmpdir(), "electricista-uso.json")) {}

  private todo(): Record<string, UsoMensual> {
    try {
      return JSON.parse(readFileSync(this.ruta, "utf8")) as Record<string, UsoMensual>;
    } catch {
      return {};
    }
  }

  leer(mes: string): UsoMensual {
    return this.todo()[mes] ?? { mes, usd: 0, consultas: 0 };
  }

  sumar(mes: string, usd: number): UsoMensual {
    const todo = this.todo();
    const actual = todo[mes] ?? { mes, usd: 0, consultas: 0 };
    const nuevo = { mes, usd: actual.usd + usd, consultas: actual.consultas + 1 };
    todo[mes] = nuevo;
    try {
      mkdirSync(dirname(this.ruta), { recursive: true });
      writeFileSync(this.ruta, JSON.stringify(todo));
    } catch {
      /* si no se puede escribir, el tope no se aplica: queda anotado en pendientes */
    }
    return nuevo;
  }
}

export const TOPE_MAXIMO_USD = 20;

/** Tope mensual configurable (TOPE_USD_MES), nunca mayor a 20 USD. */
export function topeMensualUsd(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.TOPE_USD_MES);
  return Number.isFinite(n) && n > 0 ? Math.min(n, TOPE_MAXIMO_USD) : 10;
}
