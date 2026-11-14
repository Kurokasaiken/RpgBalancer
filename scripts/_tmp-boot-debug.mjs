import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', (e) => console.log(`[pageerror] ${String(e).slice(0, 400)}`));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}]`, m.text().slice(0, 300)); });
p.on('requestfailed', (r) => console.log('[reqfail]', r.url().slice(0, 140), r.failure()?.errorText));
p.on('response', (r) => { if (r.status() >= 400) console.log('[http', r.status() + ']', r.url().slice(0, 140)); });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(45000);
const s = await p.evaluate(() => ({
  ready: !!document.querySelector('[data-map-ready]'),
  overlay: !!document.querySelector('vite-error-overlay'),
  overlayText: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.slice(0, 400) ?? null,
}));
console.log('state:', JSON.stringify(s));
await b.close();
