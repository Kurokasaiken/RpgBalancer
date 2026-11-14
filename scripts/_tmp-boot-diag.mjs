import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 250)));
p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('example-circle')) console.log('[err]', m.text().slice(0, 200)); });
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 8; i += 1) {
  await p.waitForTimeout(15000);
  const s = await p.evaluate(() => ({
    canvas: !!document.querySelector('canvas'),
    ready: !!document.querySelector('[data-map-ready]'),
    anchors: document.querySelectorAll('[data-anchor-id]').length,
    zanara: document.querySelectorAll('[data-poi-zanara]').length,
    veil: !!document.querySelector('[data-testid="game-boot-screen"]'),
    veilText: document.querySelector('[data-testid="game-boot-screen"]')?.textContent?.slice(0, 80) ?? '',
    cam: window.__worldCam?.zoom ?? null,
  }));
  console.log(`t+${(i + 1) * 15}s`, JSON.stringify(s));
  if (s.zanara > 0 || s.ready) break;
}
await b.close();
