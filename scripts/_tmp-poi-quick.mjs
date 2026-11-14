import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', (e) => console.log(`[pageerror] ${String(e).slice(0, 300)}`));
p.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text().slice(0, 250)); });
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 12; i += 1) {
  await p.waitForTimeout(5000);
  const s = await p.evaluate(() => ({
    ready: !!document.querySelector('[data-map-ready]'),
    overlay: !!document.querySelector('vite-error-overlay'),
    zan: document.querySelectorAll('[data-poi-zanara]').length,
  }));
  console.log(`t+${(i + 1) * 5}s`, JSON.stringify(s));
  if (s.ready && s.zan > 0) break;
}
await b.close();
