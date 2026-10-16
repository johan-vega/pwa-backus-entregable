import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Sirve el build Angular de producción; no implementa API ni reemplaza ng serve.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/backus-ventas-pwa/browser');
const port = Number(process.argv[process.argv.indexOf('--port') + 1]) || 8080;
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml'
};
// Evita traversal de rutas y usa fallback SPA solo para rutas sin extensión.
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (file === root) file = path.join(root, 'index.html');
    try { if (!(await stat(file)).isFile()) throw new Error(); }
    catch {
      if (path.extname(pathname)) { res.writeHead(404); res.end('No encontrado'); return; }
      file = path.join(root, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch { res.writeHead(500); res.end('Primero ejecuta npm run build.'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
