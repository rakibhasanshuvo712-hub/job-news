import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedIfEmpty } from './src/seed.js';
import { handleApi } from './src/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3000', 10);

seedIfEmpty();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
    stream.pipe(res);
  });
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });
}

const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); }
  catch { res.writeHead(400); return res.end('Bad request'); }

  // API routes
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    return handleApi(req, res, url);
  }

  // Static files from public/
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.includes('..')) { res.writeHead(400); return res.end('Bad request'); }
  let filePath = path.join(PUBLIC_DIR, pathname);
  if (pathname.endsWith('/')) filePath = path.join(filePath, 'index.html');

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  // Extension-less pages -> serve their .html (multi-page site)
  const candidate = filePath + '.html';
  if (fs.existsSync(candidate)) return serveFile(res, candidate);

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>404 — JobNews</title>
    <style>body{font-family:system-ui;display:flex;min-height:70vh;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#f4f6fb}
    a{color:#1d4ed8;font-weight:600}</style></head>
    <body><div style="font-size:64px">🔎</div><h1>Page not found</h1>
    <p>The page you're looking for doesn't exist.</p><a href="/">← Back to JobNews home</a></body></html>`);
});

server.listen(PORT, HOST, () => {
  console.log(`JobNews server running at http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});
