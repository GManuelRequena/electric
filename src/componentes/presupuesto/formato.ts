export const pesos = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
export const cantidadTexto = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
export const fechaHoy = () => new Date().toISOString().slice(0, 10);
