import { describe, expect, it } from "vitest";
import { configAuthDeEntorno, crearToken, iguales, verificarToken } from "./auth";

describe("login con contraseña única", () => {
  it("un token recién creado es válido", async () => {
    expect(await verificarToken(await crearToken("secreto"), "secreto")).toBe(true);
  });
  it("rechaza token de otro secreto, alterado, vencido o ausente", async () => {
    const t = await crearToken("secreto", Date.now());
    expect(await verificarToken(t, "otro")).toBe(false);
    expect(await verificarToken(t.replace(/.$/, (c) => (c === "0" ? "1" : "0")), "secreto")).toBe(false);
    expect(await verificarToken(t, "secreto", Date.now() + 40 * 24 * 3600 * 1000)).toBe(false);
    expect(await verificarToken(undefined, "secreto")).toBe(false);
    expect(await verificarToken("basura", "secreto")).toBe(false);
    expect(await verificarToken(t, undefined)).toBe(false);
  });
  it("compara contraseñas sin atajos", () => {
    expect(iguales("abc", "abc")).toBe(true);
    expect(iguales("abc", "abd")).toBe(false);
    expect(iguales("abc", "abcd")).toBe(false);
  });
  it("sin APP_PASSWORD no hay secreto; SESSION_SECRET tiene prioridad", () => {
    expect(configAuthDeEntorno({})).toEqual({ password: undefined, secreto: undefined });
    expect(configAuthDeEntorno({ APP_PASSWORD: "p", SESSION_SECRET: "s" })).toEqual({ password: "p", secreto: "s" });
    expect(configAuthDeEntorno({ APP_PASSWORD: "p" }).secreto).toBe("p");
  });
});
