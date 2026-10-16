import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Producto } from '../models/models';
import { cantidadValida, subtotal } from '../models/order';
@Component({
  selector: 'app-catalog', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html', styleUrl: './catalog.component.scss'
})
// Presenta productos recibidos por Input y devuelve la selección al componente raíz mediante Output.
export class CatalogComponent {
  @Input() products: Producto[] = [];
  @Input() busy = false;
  @Output() add = new EventEmitter<{ product: Producto; quantity: number }>();
  search = '';
  category = '';
  quantities: Record<number, number | null> = {};
  attempted: Record<number, boolean> = {};
  // El filtro combina texto de producto y categoría; las opciones se derivan del JSON recibido.
  get categories(): string[] { return [...new Set(this.products.map(p => p.categoria))]; }
  get filtered(): Producto[] {
    return this.products.filter(p => p.producto.toLocaleLowerCase('es').includes(this.search.trim().toLocaleLowerCase('es')) && (!this.category || this.category === p.categoria));
  }
  // Restablece solo los filtros locales; no vuelve a solicitar el catálogo.
  clear(): void { this.search = ''; this.category = ''; }
  // Cada producto empieza en una unidad; quantities conserva los cambios del usuario por id.
  quantity(id: number): number | null { return this.quantities[id] === undefined ? 1 : this.quantities[id]; }
  valid(id: number): boolean { return cantidadValida(this.quantity(id)); }
  // Registra intento, valida cantidad e importe y emite el producto; el padre modifica el carrito.
  addProduct(product: Producto): void {
    this.attempted[product.id] = true;
    const quantity = this.quantity(product.id);
    if (!cantidadValida(quantity)) return;
    try { subtotal(product.precio, quantity); } catch { this.quantities[product.id] = null; return; }
    this.add.emit({ product, quantity });
  }
}
