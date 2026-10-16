import { Injectable } from '@angular/core';
import { LocalDatabase } from './database';
import { Mensaje, Pedido } from '../models/models';
import { totalPedido } from '../models/order';
@Injectable({ providedIn: 'root' })
// Adaptador del dominio Backus a IndexedDB: base backusVentasDB y almacenes pedidos/mensajes.
export class StorageService extends LocalDatabase {
  constructor() { super('backusVentasDB', ['pedidos', 'mensajes']); }
  // Valida y normaliza el pedido; su id local se devuelve solo después de confirmar la escritura.
  async guardarPedido(pedido: Pedido): Promise<Pedido> {
    if (!pedido.lineas.length) throw new Error('Agrega al menos un producto.');
    const record: Pedido = {
      fecha: new Date().toISOString(),
      lineas: pedido.lineas.map(l => ({ ...l, subtotal: totalPedido([l]) })),
      total: totalPedido(pedido.lineas), origen: pedido.origen, estado: 'PENDIENTE'
    };
    const key = await this.execute<IDBValidKey>('pedidos', 'readwrite', store => store.add(record));
    return { ...record, id: Number(key) };
  }
  // Devuelve los pedidos más recientes primero para el historial de la interfaz.
  async listarPedidos(): Promise<Pedido[]> {
    const records = await this.execute<Pedido[]>('pedidos', 'readonly', store => store.getAll());
    return records.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }
  // Consulta opcional de un pedido por su clave autoincremental de IndexedDB.
  obtenerPedido(id: number): Promise<Pedido | undefined> {
    return this.execute('pedidos', 'readonly', store => store.get(id));
  }
  // Guarda notas no vacías con fecha y origen local; no realiza ninguna petición de red.
  async guardarMensaje(contenido: string, origen: 'ONLINE' | 'OFFLINE'): Promise<Mensaje> {
    if (!contenido.trim()) throw new Error('Escribe un mensaje antes de guardar.');
    const record: Mensaje = { contenido: contenido.trim(), fecha: new Date().toISOString(), origen, estado: 'PENDIENTE' };
    const key = await this.execute<IDBValidKey>('mensajes', 'readwrite', store => store.add(record));
    return { ...record, id: Number(key) };
  }
  // Recupera mensajes locales y los ordena por id descendente.
  async listarMensajes(): Promise<Mensaje[]> {
    const records = await this.execute<Mensaje[]>('mensajes', 'readonly', store => store.getAll());
    return records.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }
}
