// Producto tal como llega de public/data/catalogo.json; imagen contiene una ruta local de public/.
export interface Producto {
  id: number;
  producto: string;
  categoria: string;
  precio: number;
  presentacion: string;
  imagen: string;
}
// Línea que se agrega al carrito y se copia dentro del pedido persistido.
export interface LineaPedido {
  productoId: number;
  producto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}
// Estado previsto para una futura integración; actualmente los registros nuevos quedan PENDIENTE.
export type EstadoPedido = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR';
// Pedido local en IndexedDB. id lo asigna el almacén y origen refleja el estado de red al guardar.
export interface Pedido {
  id?: number;
  fecha: string;
  lineas: LineaPedido[];
  total: number;
  estado: EstadoPedido;
  origen: 'ONLINE' | 'OFFLINE';
}
// Nota del vendedor almacenada localmente; no existe endpoint remoto en esta práctica.
export interface Mensaje {
  id?: number;
  contenido: string;
  fecha: string;
  origen: 'ONLINE' | 'OFFLINE';
  estado: EstadoPedido;
}
