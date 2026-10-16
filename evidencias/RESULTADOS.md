# Verificación ejecutada - Backus Ventas

Fecha: **16/10/2026** (America/Lima). Compilación de producción y pruebas reales en Microsoft Edge 155.0.4283.45, Windows, Node.js 24.15.0 y Playwright 1.56.1.

**Resultado: 3 grupos de pruebas aprobados, 0 fallos.** Producción compilada correctamente, sin advertencias de presupuesto. Iconos PNG comprobados en 192×192 y 512×512; configuración generada `ngsw.json` comprobada con `performance` y `freshness`.

| Casos | Resultado observado |
| --- | --- |
| BV-01 / BV-02 | Buscar PILSEN y combinar Cerveza muestra un producto; combinar Agua muestra cero; limpiar restaura seis. |
| BV-03 | Cero, negativos, decimales y campo vacío no agregan productos al pedido. |
| BV-04 | 2 Cristal + 3 Pilsen producen S/ 15.00 + S/ 24.00 = S/ 39.00. |
| Pedido vacío | Se impide el registro y no se crea una fila local. |
| BV-05 | El pedido completo reaparece al recargar y su detalle muestra ambas líneas. |
| Doble clic | Solo se crea un pedido al pulsar dos veces durante el guardado. |
| Offline | Service Worker controla la página, catálogo servido desde caché, recarga y nuevo pedido con origen OFFLINE. |
| BV-06 | Pedidos online/offline siguen PENDIENTES después de recuperar conexión. |
| Mensajes base | Mensaje offline persiste tras recargar y conserva PENDIENTE. |
| BV-07 | Abortar una transacción después del éxito de la solicitud no anuncia éxito; carrito/texto conservados, sin registro creado. |
| Error de lectura | IndexedDB no disponible produce un aviso visible. |
| Vista móvil | Revisada en 390×844, sin desbordamiento horizontal. |

## Capturas y datos

- [Catálogo](01-catalogo.png).
- [Búsqueda y categoría](02-busqueda-filtro.png).
- [Resumen, cantidades y total](03-resumen-pedido.png).
- [Historial y detalle](04-historial.png).
- [Pedido en modo offline](05-pedido-offline.png).
- [Mensaje conservado offline](06-mensajes-offline.png).
- [Registros reales de pedidos en IndexedDB](07-indexeddb-pedidos.json).
- [Registros reales de mensajes en IndexedDB](08-indexeddb-mensajes.json).
- [Diagnóstico real del navegador: manifest, SW, caché e IndexedDB](09-diagnostico-real.png).
- [Vista móvil](10-movil.png).
- [Fallo de escritura y carrito conservado](11-error-persistencia.png).

Las capturas se generaron automáticamente durante el recorrido; los JSON contienen datos leídos de IndexedDB del perfil aislado de prueba. La captura de diagnóstico corresponde a `diagnostico.html`, no a DevTools. El perfil temporal no introduce registros en el navegador habitual del usuario.

Para reproducir: `npm.cmd test`. Para capturas específicamente de los paneles DevTools o una auditoría Lighthouse, sigue los pasos manuales del README. No se probó una instalación física en Android/iOS ni una sincronización remota: esta práctica no incluye API.
