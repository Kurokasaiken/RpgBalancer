import { chromium } from '@playwright/test';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__worldCamCtl, null, { timeout: 90000 });
await p.waitForTimeout(4000);
// village zone centre ~ world (1515,700), zoom 2
await p.evaluate(() => window.__worldCamCtl.set({ panX: 1515 - 720 / 2, panY: 700 - 450 / 2, zoom: 2 }));
await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/vill-default.png' });
// force state via live object if exposed; else click plate button for stone|wall|stone+stone
const btn = p.locator('button', { hasText: 'stone · wall · stone+stone' });
if (await btn.count()) await btn.first().click();
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/vill-stone-stone.png' });
const btn2 = p.locator('button', { hasText: 'stone · palisade · wood+wood' });
if (await btn2.count()) await btn2.first().click();
await p.waitForTimeout(1200);
await p.screenshot({ path: '/tmp/vill-pal-ww.png' });
await b.close();
console.log('done');
