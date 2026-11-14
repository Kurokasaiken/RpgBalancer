import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[${m.type()}]`, m.text().slice(0, 300)); });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 500)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(25000);
const state = await p.evaluate(() => ({
  ready: !!document.querySelector('[data-map-ready]'),
  canvas: !!document.querySelector('canvas'),
  boot: !!document.querySelector('[data-testid="game-boot-screen"]'),
  worldCam: !!window.__worldCam,
  body: document.body.innerText.slice(0, 200),
}));
console.log(JSON.stringify(state, null, 1));
await p.screenshot({ path: 'test-results/r325-game-restore/diag.png' });
await b.close();
