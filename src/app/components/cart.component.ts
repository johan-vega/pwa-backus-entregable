import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LineaPedido } from '../models/models';
@Component({
  selector: 'app-cart', standalone: true, template: `
  <!-- Resumen de las líneas que mantiene AppComponent en memoria hasta confirmar un pedido local. -->
  <section class="panel panel-pad" aria-labelledby="cart-title"><div class="section-heading"><div><h2 id="cart-title">Tu pedido</h2><p>Revisa el resumen antes de guardar.</p></div><span class="count">{{ lines.length }}</span></div>
    @if (!lines.length) {<div class="empty"><span class="empty-symbol">▤</span><strong>Tu pedido empieza aquí</strong>Agrega productos del catálogo para preparar un pedido.</div>}
    @for (line of lines; track line.productoId) {
      <div class="cart-line"><div><h3>{{ line.producto }}</h3><p class="meta">{{ line.cantidad }} × S/ {{ line.precioUnitario.toFixed(2) }}</p><button type="button" class="text-button danger" [disabled]="busy" (click)="remove.emit(line.productoId)" [attr.aria-label]="'Quitar ' + line.producto">Quitar</button></div><strong>S/ {{ line.subtotal.toFixed(2) }}</strong></div>
    }
    <div class="divider"></div><div class="summary-total"><span>Total del pedido</span><strong data-testid="cart-total">S/ {{ total.toFixed(2) }}</strong></div>
    <button class="button full" (click)="save.emit()" [disabled]="busy">{{ busy ? 'Guardando…' : 'Guardar pedido local' }} <span aria-hidden="true">→</span></button>
    <p class="help">Se guarda primero en este dispositivo con estado PENDIENTE. Esta práctica no envía pedidos a un servidor.</p>
  </section>`, styles: `/* Filas y subtotales del resumen del carrito. */ .cart-line{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--border);padding:16px 0 2px}.cart-line h3{font-size:12px}.cart-line p{font-size:10px;margin:0}.cart-line>strong{font-size:12px;white-space:nowrap}.cart-line .text-button{font-size:10px}`
})
// Componente presentacional: emite acciones de quitar/guardar, pero no persiste ni calcula totales.
export class CartComponent {
  @Input() lines: LineaPedido[] = [];
  @Input() total = 0;
  @Input() busy = false;
  @Output() remove = new EventEmitter<number>();
  @Output() save = new EventEmitter<void>();
}
