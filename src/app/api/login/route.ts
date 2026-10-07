import { z } from "zod";
import { COOKIE_SESION, DURACION_SESION_S, configAuthDeEntorno, crearToken, iguales } from "@/integraciones/consulta/servidor/auth";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const { password, secreto } = configAuthDeEntorno();
  if (!password || !secreto) return Response.json({ error: "El login no está configurado (falta APP_PASSWORD en el servidor)." }, { status: 503 });
  const cuerpo = z.object({ password: z.string().max(200) }).safeParse(await req.json().catch(() => null));
  if (!cuerpo.success || !iguales(cuerpo.data.password, password)) return Response.json({ error: "Contraseña incorrecta." }, { status: 401 });
  const token = await crearToken(secreto);
  const seguro = process.env.NODE_ENV === "production" && new URL(req.url).protocol === "https:";
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${COOKIE_SESION}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURACION_SESION_S}${seguro ? "; Secure" : ""}`);
  return res;
}

export function DELETE(): Response {
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", `${COOKIE_SESION}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return res;
}
