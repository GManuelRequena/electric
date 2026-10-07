import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, configAuthDeEntorno, verificarToken } from "@/integraciones/consulta/servidor/auth";

/** Protege la API con costo: sin cookie de sesión válida responde 401. */
export async function proxy(req: NextRequest) {
  const { secreto } = configAuthDeEntorno();
  if (!secreto) return NextResponse.json({ error: "El login no está configurado (falta APP_PASSWORD en el servidor)." }, { status: 503 });
  if (!(await verificarToken(req.cookies.get(COOKIE_SESION)?.value, secreto))) {
    return NextResponse.json({ error: "Iniciá sesión para usar el asistente." }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/consultar", "/api/uso"] };
