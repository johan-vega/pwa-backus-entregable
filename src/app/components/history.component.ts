import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../models/models';
@Component({
    selector: 'app-history', standalone: true, imports: [CommonModule], template: `
<!-- Lista pedidos recibidos por Input desde IndexedDB; details despliega sus líneas guardadas. -->
<section class="panel panel-pad" aria-labelledby="history-title"><div class="section-heading"><div><h2 id="history-title">Historial local de pedidos</h2><p>Pedidos guardados en este navegador. Disponibles después de recargar.</p></div><span class="count">{{ orders.length }} pedidos</span></div>
@for (order of orders; track order.id) {<article class="record" [attr.data-order-id]="order.id"><div class="record-heading"><div><h3>Pedido #{{ order.id }}</h3><p class="meta">{{ order.fecha | date:'dd/MM/yyyy, HH:mm' }} · Origen {{ order.origen }}</p></div><span class="tag">{{ order.estado }}</span></div><div class="record-bottom"><span class="meta">{{ order.lineas.length }} productos · Guardado en el dispositivo</span><strong>S/ {{ order.total.toFixed(2) }}</strong></div><details class="details"><summary>Ver detalle del pedido #{{ order.id }}</summary><div class="details-body table-wrap"><table><thead><tr><th>Producto</th><th>Precio unitario</th><th>Cantidad</th><th>Subtotal</th></tr></thead><tbody>@for (line of order.lineas; track line.productoId) {<tr><td>{{ line.producto }}</td><td>S/ {{ line.precioUnitario.toFixed(2) }}</td><td>{{ line.cantidad }}</td><td>S/ {{ line.subtotal.toFixed(2) }}</td></tr>}</tbody></table><p class="help">Sin API de sincronización: el estado permanece PENDIENTE.</p></div></details></article>}
@empty {<div class="empty"><span class="empty-symbol">◷</span><strong>Aún no hay pedidos guardados</strong>Prepara tu primer pedido en el catálogo.</div>}</section>` })
// Vista de solo lectura: la carga y el orden los resuelve AppComponent/StorageService.
export class HistoryComponent { @Input() orders: Pedido[] = []; }
