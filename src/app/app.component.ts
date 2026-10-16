import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from './components/shell.component';
import { CatalogComponent } from './components/catalog.component';
import { CartComponent } from './components/cart.component';
import { HistoryComponent } from './components/history.component';
import { CatalogoService } from './services/catalogo.service';
import { StorageService } from './services/storage.service';
import { ConnectivityService } from './services/connectivity.service';
import { NoticeService } from './services/notice.service';
import { LineaPedido, Mensaje, Pedido, Producto } from './models/models';
import { cantidadValida, subtotal, totalPedido } from './models/order';
// Componente raíz: coordina catálogo remoto/cacheado, carrito en memoria e historial/mensajes de IndexedDB.
@Component({
  selector: 'app-root', standalone: true,
  imports: [CommonModule, FormsModule, ShellComponent, CatalogComponent, CartComponent, HistoryComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  // Señales globales que consume el aviso de la pantalla y el estado de conexión.
  readonly network = inject(ConnectivityService);
  readonly notice = inject(NoticeService);
  private catalog = inject(CatalogoService);
  private storage = inject(StorageService);
  active = 'catalogo';
  products: Producto[] = [];
  lines: LineaPedido[] = [];
  orders: Pedido[] = [];
  messages: Mensaje[] = [];
  messageText = '';
  notification = '';
  error = false;
  busy = false;
  loading = true;
  loadError = '';
  storageError = '';
  // Metadatos de las pestañas; sus contadores derivan del estado que mantiene este componente.
  get tabs() { return [{ id: 'catalogo', label: 'Catálogo', icon: '▦' }, { id: 'historial', label: 'Mis pedidos', icon: '▤', count: this.orders.length }, { id: 'mensajes', label: 'Mensajes', icon: '✉', count: this.messages.length }]; }
  // Texto de cabecera y totales calculados desde el estado en memoria, no desde una API.
  get section(): string { return this.active === 'catalogo' ? 'Catálogo' : this.active === 'historial' ? 'Mis pedidos' : 'Mensajes'; }
  get total(): number { return totalPedido(this.lines); }
  get pending(): number { return this.orders.filter(p => p.estado === 'PENDIENTE').length; }
  // Al abrir la app carga el catálogo por HTTP (con fallback de caché SW) y recupera registros locales.
  ngOnInit(): void { this.loadCatalog(); void this.loadLocal(); }
  // Navegación por pestañas: cambia la vista sin cambiar la URL.
  navigate(tab: string): void { this.active = tab; this.notification = ''; }
  // Catálogo servido desde public/data/catalogo.json; Angular Service Worker puede responder desde caché offline.
  loadCatalog(): void {
    this.loading = true; this.loadError = '';
    this.catalog.obtenerCatalogo().subscribe({
      next: products => { this.products = products; this.loading = false; },
      error: () => { this.loading = false; this.loadError = 'No se pudo cargar el catálogo. Conéctate y ábrelo una vez para almacenarlo en caché.'; }
    });
  }
  // Lee ambos almacenes locales en paralelo; un fallo se muestra como error de almacenamiento.
  async loadLocal(): Promise<void> {
    this.storageError = '';
    try { [this.orders, this.messages] = await Promise.all([this.storage.listarPedidos(), this.storage.listarMensajes()]); }
    catch { this.storageError = 'No se pudo leer IndexedDB. Permite el almacenamiento local y reintenta.'; }
  }
  // Añade o acumula unidades por producto y recalcula el subtotal antes de aceptar el cambio.
  add({ product, quantity }: { product: Producto; quantity: number }): void {
    if (this.busy) return;
    try {
      if (!cantidadValida(quantity)) throw new Error('La cantidad debe ser un entero positivo.');
      const existing = this.lines.find(l => l.productoId === product.id);
      const newQuantity = quantity + (existing?.cantidad ?? 0);
      const line: LineaPedido = { productoId: product.id, producto: product.producto, precioUnitario: product.precio, cantidad: newQuantity, subtotal: subtotal(product.precio, newQuantity) };
      const next = [...this.lines.filter(l => l.productoId !== product.id), line];
      totalPedido(next);
      this.lines = next;
      this.notify(`${product.producto} agregado al pedido.`, false);
    } catch { this.notify('Cantidad inválida o importe fuera del rango permitido.', true); }
  }
  // Quita una línea del carrito en memoria; todavía no existe un pedido persistido.
  remove(id: number): void { if (!this.busy) this.lines = this.lines.filter(l => l.productoId !== id); }
  // Guarda el pedido en IndexedDB; solo limpia el carrito después de completar la transacción.
  async saveOrder(): Promise<void> {
    if (this.busy) return;
    if (!this.lines.length) { this.notify('Agrega al menos un producto antes de registrar el pedido.', true); return; }
    this.busy = true; this.notification = '';
    try {
      const order = await this.storage.guardarPedido({ fecha: '', lineas: this.lines, total: this.total, estado: 'PENDIENTE', origen: this.network.online() ? 'ONLINE' : 'OFFLINE' });
      this.orders = [order, ...this.orders]; this.lines = [];
      this.notify(`Pedido #${order.id} guardado en este dispositivo. Estado: PENDIENTE. Sin API: no se ha enviado a un servidor.`, false);
    } catch { this.notify('No se pudo guardar el pedido en IndexedDB. Tu pedido se conserva en el formulario; reintenta.', true); }
    finally { this.busy = false; }
  }
  // Persiste una nota local indicando si el navegador reportaba conexión al guardarla.
  async saveMessage(): Promise<void> {
    if (this.busy) return;
    if (!this.messageText.trim()) { this.notify('Escribe un mensaje antes de guardar.', true); return; }
    this.busy = true; this.notification = '';
    try {
      const message = await this.storage.guardarMensaje(this.messageText, this.network.online() ? 'ONLINE' : 'OFFLINE');
      this.messages = [message, ...this.messages]; this.messageText = '';
      this.notify('Mensaje guardado en este dispositivo. Estado: PENDIENTE. No se ha enviado a un servidor.', false);
    } catch { this.notify('No se pudo guardar el mensaje en IndexedDB. Conservamos el texto para reintentar.', true); }
    finally { this.busy = false; }
  }
  // Centraliza el texto y la severidad que la plantilla presenta como status o alert.
  notify(message: string, error: boolean): void { this.notification = message; this.error = error; }
}
