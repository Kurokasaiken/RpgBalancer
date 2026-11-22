import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
p.on('console', (m) => { if (m.type() !== 'log') logs.push(`${m.type()}: ${m.text().slice(0, 120)}`); });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74&reward=4', { waitUntil: 'domcontentloaded', timeout: 90000 });
await p.waitForSelector('[data-cassetto-column]', { timeout: 120000 });
await p.waitForTimeout(6000);
const px = await p.evaluate(() => {
  const c = document.querySelector('canvas');
  const ctx = c.getContext('webgl2') || c.getContext('webgl');
  return { type: ctx ? ctx.constructor.name : 'none', canvasInDom: !!c };
});
await p.screenshot({ path: '/tmp/cass-map-retry.png' });
console.log('ctx:', JSON.stringify(px), 'console:', logs.slice(0, 10));
await b.close();
