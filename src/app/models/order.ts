import { LineaPedido } from './models';
// Valida cantidades recibidas desde el input o cualquier otro consumidor antes del cálculo.
export function cantidadValida(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
// Calcula por céntimos enteros para evitar errores binarios de punto flotante en moneda.
export function subtotal(precio: number, cantidad: number): number {
  const centimos = Math.round(precio * 100) * cantidad;
  if (!Number.isFinite(precio) || precio < 0 || !cantidadValida(cantidad) || !Number.isSafeInteger(centimos)) {
    throw new Error('La cantidad debe ser un entero positivo y el importe debe estar dentro del rango permitido.');
  }
  return centimos / 100;
}
// Suma subtotales ya validados y rechaza un total que exceda la precisión segura de JavaScript.
export function totalPedido(lineas: LineaPedido[]): number {
  const centimos = lineas.reduce((sum, l) => sum + Math.round(subtotal(l.precioUnitario, l.cantidad) * 100), 0);
  if (!Number.isSafeInteger(centimos)) throw new Error('El total supera el rango permitido.');
  return centimos / 100;
}
