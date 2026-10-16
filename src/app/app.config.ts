import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
// Proveedores globales: HTTP carga los JSON; el router está vacío porque la navegación es por estado local.
// El Service Worker solo se registra en producción y espera a que Angular quede estable.
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), provideRouter([]),
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })
  ]
};
