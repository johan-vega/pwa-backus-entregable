import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, open, ready, records, capture, snapshot, noOverflow, failWrites, failReads } from './helpers.mjs';
let env;
// Las pruebas usan el servidor de producción para incluir el comportamiento del Service Worker.
before(async () => { env = await setup(8180); });
after(async () => { await env?.close(); });

// Flujo integral: filtros, importes, pedido local, cache/offline y mensajes persistentes.
test('BV-01 a BV-06: filtros, cantidades, totales, persistencia, mensajes y recarga offline', { timeout: 120000 }, async () => {
  const { context, page } = await open(env);
  try {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await ready(page, '[data-product-id]');
    assert.equal(await page.locator('[data-product-id]').count(), 6);
    await capture(page, '01-catalogo');
    await page.getByRole('button', { name: 'Guardar pedido local', exact: true }).click();
    await page.getByTestId('notification').filter({ hasText: 'Agrega al menos un producto' }).waitFor();
    assert.equal((await records(page, 'backusVentasDB', 'pedidos')).length, 0);
    await page.getByLabel('Buscar producto', { exact: true }).fill('PILSEN');
    await page.getByLabel('Categoría', { exact: true }).selectOption('Cerveza');
    assert.equal(await page.locator('[data-product-id]').count(), 1);
    await capture(page, '02-busqueda-filtro');
    await page.getByLabel('Categoría', { exact: true }).selectOption('Agua');
    assert.equal(await page.locator('[data-product-id]').count(), 0);
    await page.getByRole('button', { name: 'Limpiar filtros' }).click();
    const quantity = page.getByLabel('Cantidad de Cristal 620 ml', { exact: true });
    for (const invalid of ['0', '-1', '1.5', '']) {
      await quantity.fill(invalid);
      await page.getByRole('button', { name: 'Agregar Cristal 620 ml', exact: true }).click();
      assert.equal(await page.getByTestId('cart-total').textContent(), 'S/ 0.00');
      assert.equal(await quantity.getAttribute('aria-invalid'), 'true');
    }
    await quantity.fill('2');
    await page.getByRole('button', { name: 'Agregar Cristal 620 ml', exact: true }).click();
    await page.getByLabel('Cantidad de Pilsen Callao 620 ml', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Agregar Pilsen Callao 620 ml', exact: true }).click();
    assert.equal(await page.getByTestId('cart-total').textContent(), 'S/ 39.00');
    await capture(page, '03-resumen-pedido');
    await page.getByRole('button', { name: 'Guardar pedido local', exact: true }).dblclick();
    await page.getByTestId('notification').filter({ hasText: 'guardado en este dispositivo' }).waitFor();
    let orders = await records(page, 'backusVentasDB', 'pedidos');
    assert.equal(orders.length, 1); assert.equal(orders[0].total, 39); assert.equal(orders[0].lineas[0].subtotal, 15); assert.equal(orders[0].lineas[1].subtotal, 24); assert.equal(orders[0].estado, 'PENDIENTE'); assert.equal(orders[0].origen, 'ONLINE'); assert.ok(orders[0].fecha);
    await page.reload(); await page.locator('[data-product-id]').first().waitFor();
    await page.getByRole('button', { name: /Mis pedidos/ }).click();
    await page.locator('[data-order-id]').waitFor();
    await page.getByText('Ver detalle del pedido #1', { exact: true }).click();
    assert.equal(await page.locator('tbody tr').count(), 2);
    await capture(page, '04-historial');
    await context.setOffline(true);
    await page.reload(); await page.locator('[data-product-id]').first().waitFor();
    await page.getByRole('status').filter({ hasText: 'Sin conexión' }).waitFor();
    await page.getByRole('button', { name: 'Agregar Cristal 620 ml', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar pedido local', exact: true }).click();
    await page.getByTestId('notification').filter({ hasText: 'guardado en este dispositivo' }).waitFor();
    orders = await records(page, 'backusVentasDB', 'pedidos'); assert.equal(orders.length, 2); assert.equal(orders[1].origen, 'OFFLINE'); assert.equal(orders[1].estado, 'PENDIENTE');
    await page.getByRole('button', { name: /Mis pedidos/ }).click();
    await capture(page, '05-pedido-offline');
    await page.getByRole('button', { name: /Mensajes/ }).click();
    await page.getByLabel('Mensaje', { exact: true }).fill('Visita de práctica: revisar stock en próxima ruta.');
    await page.getByRole('button', { name: 'Guardar mensaje local' }).click();
    await page.getByTestId('notification').filter({ hasText: 'Mensaje guardado' }).waitFor();
    await page.reload(); await page.locator('[data-product-id]').first().waitFor();
    await page.getByRole('button', { name: /Mensajes/ }).click();
    await page.getByText('Visita de práctica: revisar stock en próxima ruta.', { exact: true }).waitFor();
    assert.equal((await records(page, 'backusVentasDB', 'mensajes'))[0].estado, 'PENDIENTE');
    await capture(page, '06-mensajes-offline');
    await context.setOffline(false);
    await page.getByText(/Conexión recuperada/).waitFor();
    assert.ok((await records(page, 'backusVentasDB', 'pedidos')).every(p => p.estado === 'PENDIENTE'));
    await snapshot(page, 'backusVentasDB', 'pedidos', '07-indexeddb-pedidos');
    await snapshot(page, 'backusVentasDB', 'mensajes', '08-indexeddb-mensajes');
    const cached = await page.evaluate(async () => { for (const key of await caches.keys()) { const c = await caches.open(key); if (await c.match('/data/catalogo.json')) return true; } return false; }); assert.equal(cached, true);
    await page.goto(env.url + '/diagnostico.html'); await page.getByRole('heading', { name: 'IndexedDB · backusVentasDB / pedidos', exact: true }).waitFor();
    await capture(page, '09-diagnostico-real');
    await page.goto(env.url); await page.locator('[data-product-id]').first().waitFor();
    await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await capture(page, '10-movil');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

// Un aborto de transacción no debe anunciar éxito ni borrar el formulario.
test('BV-07: abortar transacción no confirma éxito ni pierde carrito o mensaje', { timeout: 60000 }, async () => {
  const context = await env.browser.newContext(); await failWrites(context); const page = await context.newPage();
  try {
    await page.goto(env.url); await page.locator('[data-product-id]').first().waitFor();
    await page.getByRole('button', { name: 'Agregar Cristal 620 ml', exact: true }).click();
    await page.getByRole('button', { name: 'Guardar pedido local', exact: true }).click();
    await page.getByTestId('notification').filter({ hasText: 'No se pudo guardar el pedido' }).waitFor();
    assert.equal(await page.getByTestId('cart-total').textContent(), 'S/ 7.50');
    assert.equal((await records(page, 'backusVentasDB', 'pedidos')).length, 0);
    await page.getByRole('button', { name: /Mensajes/ }).click(); await page.getByLabel('Mensaje', { exact: true }).fill('Texto que debe conservarse'); await page.getByRole('button', { name: 'Guardar mensaje local' }).click(); await page.getByTestId('notification').filter({ hasText: 'No se pudo guardar el mensaje' }).waitFor(); assert.equal(await page.getByLabel('Mensaje', { exact: true }).inputValue(), 'Texto que debe conservarse');
    await capture(page, '11-error-persistencia');
  } finally { await context.close(); }
});
// Comprueba que la imposibilidad de abrir IndexedDB sea visible.
test('Error de lectura de IndexedDB visible', { timeout: 60000 }, async () => {
  const context = await env.browser.newContext(); await failReads(context); const page = await context.newPage();
  try { await page.goto(env.url); await page.getByRole('alert').filter({ hasText: 'No se pudo leer IndexedDB' }).waitFor(); } finally { await context.close(); }
});
