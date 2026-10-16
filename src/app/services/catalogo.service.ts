import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Producto } from '../models/models';
@Injectable({ providedIn: 'root' })
// Fuente única del catálogo: GET /data/catalogo.json, publicado desde public/data/ y cacheable por ngsw-config.json.
export class CatalogoService {
  private http = inject(HttpClient);
  obtenerCatalogo() { return this.http.get<Producto[]>('/data/catalogo.json'); }
}
