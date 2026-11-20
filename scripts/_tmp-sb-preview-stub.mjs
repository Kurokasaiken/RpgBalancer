// Redirect-stub per Devin Preview (T-19): "/" → scroll-band lab, resto → vite :5173
import http from 'node:http';
const UPSTREAM = { host: 'localhost', port: 5173 };
const ROUTE = '/mockups/scroll-band-lab/index.html';
http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(302, { Location: ROUTE });
    return res.end();
  }
  const up = http.request(
    { host: UPSTREAM.host, port: UPSTREAM.port, path: req.url, method: req.method, headers: { ...req.headers, host: `localhost:${UPSTREAM.port}` } },
    (pr) => { res.writeHead(pr.statusCode ?? 502, pr.headers); pr.pipe(res); }
  );
  up.on('error', (e) => { res.writeHead(502); res.end(String(e)); });
  req.pipe(up);
}).listen(5201, '127.0.0.1', () => console.log('redirect-stub on :5201 →', ROUTE));
