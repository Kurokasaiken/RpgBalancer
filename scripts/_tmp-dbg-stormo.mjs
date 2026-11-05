import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
p.on('console', (m) => { if (m.type() === 'error' || m.text().includes('mappa2')) console.log('[pg]', m.text().slice(0, 300)); });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 400)));
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl && window.__ambientDebug?.stormo, null, { timeout: 90000 });
console.log('mounted ok');
await p.evaluate(() => window.__ambientDebug.director.triggerStormo('to-meadow-sw'));
for (let i = 0; i < 4; i += 1) {
  await p.waitForTimeout(1500);
  const s = await p.evaluate(() => ({
    cam: !!window.__worldCamCtl,
    active: window.__ambientDebug?.stormo?.activeCount?.(),
    vis: window.__ambientDebug?.stormo?.container?.visible,
  }));
  console.log(i, JSON.stringify(s));
}
await b.close();
