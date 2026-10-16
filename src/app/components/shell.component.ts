import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { ConnectivityService } from '../services/connectivity.service';
interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }
@Component({
  selector: 'app-shell', standalone: true,
  template: `
  <!-- Enlace accesible para saltar la navegación y enfocar el contenido principal. -->
  <a class="skip-link" href="#contenido">Ir al contenido</a>
  <div class="app-layout" [class.backus]="brand === 'Backus'">
    <!-- Navegación global: el padre proporciona las pestañas y recibe el id seleccionado. -->
    <aside class="sidebar">
      <a class="brand" href="/" [attr.aria-label]="brand + ' inicio'"><img src="icons/icon-192x192.png" alt="" width="42" height="42"><span>{{ brand }}<small>{{ brand === 'Backus' ? 'VENTAS' : 'TASKHUB' }}</small></span></a>
      <div class="workspace"><span class="workspace-icon">{{ brand === 'Backus' ? 'B' : 'S' }}</span><div>{{ brand === 'Backus' ? 'Espacio comercial' : 'Campus de aprendizaje' }}<small>Proyecto académico</small></div></div>
      <p class="nav-label">{{ brand === 'Backus' ? 'GESTIÓN DE VENTAS' : 'MI ESPACIO' }}</p>
      <nav aria-label="Navegación principal">
        @for (tab of tabs; track tab.id) {
          <button type="button" [class.active]="active === tab.id" [attr.aria-current]="active === tab.id ? 'page' : null" (click)="navigate.emit(tab.id)"><span class="nav-icon" aria-hidden="true">{{ tab.icon }}</span>{{ tab.label }}@if (tab.count !== undefined) {<span class="nav-count">{{ tab.count }}</span>}</button>
        }
      </nav>
      <div class="sidebar-bottom"><div class="local-symbol" aria-hidden="true">↓</div><strong>Tu trabajo va contigo</strong><p>Guarda en este dispositivo, incluso sin conexión.</p><span class="sidebar-pill">PWA · Almacenamiento local</span></div>
      <div class="profile"><span class="avatar">{{ brand === 'Backus' ? 'V' : 'E' }}</span><div>{{ brand === 'Backus' ? 'Vendedor de práctica' : 'Estudiante SENATI' }}<small>Sesión de demostración</small></div></div>
    </aside>
    <div class="workspace-main">
      <!-- Barra global: ofrece instalación y refleja la señal de conectividad del navegador. -->
      <header class="topbar"><span>{{ brand === 'Backus' ? 'Backus Ventas' : 'SENATI TaskHub' }}<span class="topbar-divider">/</span><strong>{{ section }}</strong></span><div class="topbar-actions">
        @if (installPrompt) {<button class="button ghost small" (click)="install()">↓ Instalar app</button>}
        <span class="connection" [class.offline]="!network.online()" role="status"><i></i>{{ network.online() ? 'Conectado' : 'Sin conexión' }}</span>
      </div></header>
      <!-- ng-content inserta la vista del componente raíz antes del pie institucional. -->
      <main id="contenido" tabindex="-1"><ng-content /></main>
      <footer class="footer"><span>Práctica de Aplicaciones Web Progresivas</span><span>Angular 19 · IndexedDB · Offline</span></footer>
    </div>
  </div>`,
})
// Shell compartido: el proyecto padre define textos/tabs y ConnectivityService alimenta el estado online.
export class ShellComponent {
  @Input() brand = 'SENATI';
  @Input() section = '';
  @Input() active = '';
  @Input() tabs: { id: string; label: string; icon: string; count?: number }[] = [];
  @Output() navigate = new EventEmitter<string>();
  readonly network = inject(ConnectivityService);
  installPrompt: InstallPrompt | null = null;
  // Conserva el evento para iniciar el prompt solo tras una acción explícita del usuario.
  @HostListener('window:beforeinstallprompt', ['$event']) capture(event: Event): void { event.preventDefault(); this.installPrompt = event as InstallPrompt; }
  // El navegador informa que la PWA ya fue instalada.
  @HostListener('window:appinstalled') installed(): void { this.installPrompt = null; }
  // Consume el prompt una vez; aceptación y cancelación se gestionan en el navegador.
  async install(): Promise<void> {
    if (!this.installPrompt) return;
    const prompt = this.installPrompt;
    this.installPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; } catch { /* El navegador conserva su propia opción de instalar. */ }
  }
}
