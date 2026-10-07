import { AlmacenUsoArchivo, mesDe, topeMensualUsd } from "@/integraciones/consulta/servidor/uso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  const uso = new AlmacenUsoArchivo().leer(mesDe());
  return Response.json({ ...uso, topeUsd: topeMensualUsd() });
}
