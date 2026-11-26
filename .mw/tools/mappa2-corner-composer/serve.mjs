import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const port = Number(process.env.PORT || 5201);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
};

function sendFile(res, path) {
  res.writeHead(200, { 'content-type': mime[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(path).pipe(res);
}

http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/save') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!['mappa2-corner-composer/v1', 'mappa2-corner-composer/v2'].includes(data.schema)) throw new Error('schema mismatch');
        const outDir = join(repoRoot, '.mw/specs/mappa2-apron/corner-composer');
        await mkdir(outDir, { recursive: true });
        const latest = join(outDir, 'latest.json');
        const stamp = (data.exportedAt || new Date().toISOString()).replace(/[:.]/g, '-');
        const archive = join(outDir, `corner-composer-${stamp}.json`);
        const text = `${JSON.stringify(data, null, 2)}\n`;
        await writeFile(latest, text);
        await writeFile(archive, text);
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, path: '.mw/specs/mappa2-apron/corner-composer/latest.json' }));
      } catch (err) {
        res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
      }
    });
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    return sendFile(res, join(root, 'index.html'));
  }
  if (url.pathname === '/composite.webp') {
    return sendFile(res, join(root, 'composite.webp'));
  }
  if (url.pathname.startsWith('/assets/')) {
    const rel = normalize(url.pathname.slice('/assets/'.length));
    if (rel.includes('..')) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    const path = join(repoRoot, 'public/assets', rel);
    if (existsSync(path) && statSync(path).isFile()) return sendFile(res, path);
  }
  res.writeHead(404);
  res.end('not found');
}).listen(port, '127.0.0.1', () => {
  console.log(`mappa2 corner composer on http://localhost:${port}/`);
});
