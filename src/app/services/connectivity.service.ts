import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
@Injectable({ providedIn: 'root' })
// Traduce los eventos online/offline del navegador a señales que consumen shell y pantallas.
// navigator.onLine es orientativo; no comprueba que un servidor remoto responda.
export class ConnectivityService implements OnDestroy {
  private zone = inject(NgZone);
  readonly online = signal(navigator.onLine);
  readonly recovered = signal(false);
  private connected = () => this.zone.run(() => { this.online.set(true); this.recovered.set(true); });
  private disconnected = () => this.zone.run(() => { this.online.set(false); this.recovered.set(false); });
  // Escucha cambios del navegador dentro de Angular para actualizar la UI; al destruirse libera ambos listeners.
  constructor() { window.addEventListener('online', this.connected); window.addEventListener('offline', this.disconnected); }
  ngOnDestroy(): void { window.removeEventListener('online', this.connected); window.removeEventListener('offline', this.disconnected); }
}
