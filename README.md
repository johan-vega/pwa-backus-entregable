# Backus Ventas PWA

Caso educativo de App Manifest 002 con las mejoras del proyecto 1 de App Manifest 003. Productos, precios e ilustraciones son ficticios y de práctica.

## Ejecutar

Requisitos: Node.js con npm (se recomienda Node 22) y un navegador con Service Worker e IndexedDB.

```powershell
cd 'C:\sem complementacion practica\pwa backus'
npm.cmd install
npm.cmd run build
npm.cmd run preview
```

Abre **http://localhost:8080**. Para desarrollo: `npm.cmd start` en http://localhost:4200. El servidor de producción incluido solo escucha en el equipo local.

## Funcionalidades

- Catálogo JSON con los productos originales: Cristal 620 ml (S/ 7.50), Pilsen Callao 620 ml (S/ 8.00) y Cusqueña 620 ml (S/ 9.00).
- Búsqueda por nombre sin distinguir mayúsculas, combinable con categoría y botón para limpiar filtros.
- Cantidad por producto: solo números enteros positivos representables con precisión. Se rechazan cero, negativos, decimales y campos vacíos. Se limita el importe al rango seguro de JavaScript.
- Carrito con precio unitario, cantidad, subtotal, total y opción para quitar productos. Agregar el mismo producto acumula su cantidad.
- Cálculos en céntimos para evitar errores de redondeo de importes.
- Registro no vacío, persistido en IndexedDB antes de confirmar éxito, con fecha, líneas, total, origen `ONLINE`/`OFFLINE` y estado `PENDIENTE`.
- Historial local ordenado del más reciente al más antiguo, detalle desplegable y recuperación al recargar.
- Mensajes del vendedor, conservados del proyecto base, con guardado online/offline y listado local persistente.
- Indicador de conexión, aviso de recuperación y mensajes que explican el alcance local.
- Manejo de fallos de lectura/escritura; el carrito o texto se conserva si falla el guardado. El bloqueo durante la escritura evita duplicados accidentales por doble clic.
- Interfaz adaptable, etiquetas accesibles y botón de instalación cuando el navegador lo ofrece.

## Organización

```text
src/app/
  components/          Catálogo, carrito, historial y estructura visual
  models/              Interfaces y validación/cálculo de pedidos
  services/            Catálogo HTTP, IndexedDB, conexión y avisos
  app.component.*      Coordinación del flujo y mensajes
public/
  data/catalogo.json   Datos de ejemplo
  data/avisos.json     Ejemplo consumido con estrategia freshness
  icons/               PNG de 192, 512 y maskable 512
  illustrations/       Ilustraciones SVG locales
  manifest.webmanifest Identidad e instalación
  diagnostico.html     Inspección técnica de solo lectura
ngsw-config.json       Configuración del Service Worker
scripts/serve.mjs      Servidor local de producción sin dependencias
tests/                 Pruebas funcionales de navegador
evidencias/            Capturas y registros reales de las pruebas
```

Angular core 19.2.25 y CLI/build 19.2.27. Las versiones exactas de todas las dependencias están en `package-lock.json`.

## Seguir los datos

`CatalogoService` lee `GET /data/catalogo.json` desde `public/data/catalogo.json`; el campo `imagen` de cada producto apunta a un archivo de `public/`. `NoticeService` lee `/data/avisos.json`. `StorageService` guarda pedidos y mensajes en IndexedDB (`backusVentasDB`, almacenes `pedidos` y `mensajes`). El carrito vive primero en memoria en `AppComponent` y solo pasa a IndexedDB al guardar. JSON, manifest y configuración del Service Worker se conservan sin comentarios para mantener su formato válido; el código consumidor indica aquí y junto a la lectura sus fuentes.

## PWA y almacenamiento

- Manifest: `Backus Ventas PWA`, nombre corto `Backus`, tema `#0033a0`, fondo blanco, modo `standalone`, alcance/inicio `./` e iconos PNG.
- Service Worker habilitado solo en producción mediante `provideServiceWorker`. El shell, iconos e ilustraciones se precargan.
- Runtime caching del catálogo `/data/catalogo.json`: `performance`, máximo 50 respuestas, vigencia 1 día. La URL del servicio coincide con la configuración y el archivo publicado.
- Avisos `/data/avisos.json`: `freshness`, espera de red 3 segundos y fallback a una respuesta previamente cacheada de hasta 1 hora. Si no hay respuesta ni caché, queda un aviso predeterminado.
- IndexedDB: base `backusVentasDB`, almacenes `pedidos` y `mensajes`, claves locales autoincrementales. Las promesas se resuelven al completar la transacción; un `onsuccess` seguido de aborto no anuncia éxito.

Una primera visita con conexión descarga el shell. Espera a que el Service Worker se active y recarga online para que controle las peticiones y almacene el catálogo. Posteriormente podrás recargar offline mientras exista caché válida. El catálogo no queda garantizado en una primera visita sin Internet ni después de expirar la caché.

## Pruebas automáticas y evidencias

```powershell
npm.cmd test
```

La prueba compila producción, inicia un servidor temporal en 8180, ejecuta Microsoft Edge en segundo plano en Windows, captura evidencias y cierra el navegador/servidor. Para Chrome: `$env:PWA_BROWSER='chrome'`. En otros sistemas, instala Chromium con `npx playwright install chromium` antes de ejecutar las pruebas.

Cobertura: BV-01 a BV-07, filtros combinados, carrito vacío, cantidades inválidas, total de S/ 39.00 para 2 Cristal + 3 Pilsen, persistencia, doble clic, origen offline, mensajes, retorno de conexión, caché real, pantalla móvil y errores de lectura/escritura. El fallo de escritura se prueba abortando la transacción después del éxito de la solicitud: debe conservar el formulario y no confirmar guardado.

Consulta [evidencias/RESULTADOS.md](evidencias/RESULTADOS.md) para el resultado ejecutado y la relación de capturas. Los JSON de evidencia son instantáneas extraídas de IndexedDB durante la prueba, con su Service Worker y claves de Cache Storage.

## Comprobar manualmente con DevTools

1. Abre producción online; en F12 → Application → Manifest revisa nombre, iconos y modo standalone.
2. En Service Workers espera al estado `activated`. Recarga online y consulta el catálogo.
3. En Cache Storage comprueba el shell y `/data/catalogo.json`.
4. Busca `PILSEN`, combina con `Cerveza` y luego con `Agua`; limpia filtros.
5. Intenta cantidades `0`, `-1`, `1.5` y vacío: no deben agregarse. Intenta guardar un pedido vacío.
6. Agrega 2 Cristal y 3 Pilsen: subtotales S/ 15.00 y S/ 24.00, total S/ 39.00. Guarda, recarga y revisa Mis pedidos.
7. En Network → Offline recarga. Guarda otro pedido y un mensaje. Comprueba el estado `PENDIENTE` y origen `OFFLINE` en Application → IndexedDB.
8. Recupera la red: cambia el indicador y permanece `PENDIENTE`.
9. Opcionalmente abre [diagnóstico local](http://localhost:8080/diagnostico.html) para consultar los datos del navegador sin modificarlos.

## Límites y decisiones

No existe una API: guardar no equivale a enviar. IndexedDB guarda información estructurada; Cache Storage sirve recursos/respuestas GET; el manifiesto define la instalación. `navigator.onLine` es un indicador aproximado, no una prueba de disponibilidad de un servidor.

Una futura API necesitaría las líneas del pedido, cantidades, importes y una clave de idempotencia estable para evitar duplicados al reintentar. Debe recalcular precios/totales en el servidor y confirmar la recepción antes de marcar `SINCRONIZADO`. Los registros locales deben persistirse antes de confirmar para que una recarga no pierda información.

Documentación de referencia: [configuración del Service Worker de Angular](https://angular.dev/ecosystem/service-workers/config) y [pruebas de una PWA Angular](https://angular.dev/ecosystem/service-workers/getting-started).
