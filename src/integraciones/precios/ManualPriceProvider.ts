import { db } from "../persistencia/db";
import type { Precio, PriceProvider } from "./PriceProvider";

/** Precios cargados a mano o importados desde CSV/XLSX; viven en IndexedDB. */
export class ManualPriceProvider implements PriceProvider {
  id = "manual";
  nombre = "Precios propios";

  async obtenerPrecios(codigos: string[]): Promise<Map<string, Precio>> {
    const base = await db();
    const m = new Map<string, Precio>();
    for (const codigo of codigos) {
      const p = await base.get("precios", codigo);
      if (p) m.set(codigo, p);
    }
    return m;
  }

  async listar(): Promise<Precio[]> {
    return (await (await db()).getAll("precios")).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }

  async guardar(precios: Precio | Precio[]): Promise<void> {
    const base = await db();
    const tx = base.transaction("precios", "readwrite");
    for (const p of Array.isArray(precios) ? precios : [precios]) void tx.store.put(p);
    await tx.done;
  }

  async borrar(codigo: string): Promise<void> {
    await (await db()).delete("precios", codigo);
  }

  async borrarTodos(): Promise<void> {
    await (await db()).clear("precios");
  }
}
