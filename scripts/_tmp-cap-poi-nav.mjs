import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
pg.on('pageerror', e => console.log('[pageerror]', String(e).slice(0,300)));
await pg.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
let last = '';
for (let i = 0; i < 100; i++) {
  const s = await pg.evaluate(() => ({
    phase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
    alert: document.querySelector('[role="alert"]')?.textContent ?? null,
    canvas: !!document.querySelector('canvas'),
  })).catch(() => null);
  const key = JSON.stringify(s);
  if (key !== last) { console.log(`t+${i*2}s`, key); last = key; }
  if (!s || s.alert || (s.phase === null && s.canvas)) break;
  await pg.waitForTimeout(2000);
}
await pg.waitForTimeout(4000);
await pg.screenshot({ path: '.mw/runs/20261120-piastrina-icone/gen/live-poi-nav.png', timeout: 60000 });
await b.close();
console.log('done');
