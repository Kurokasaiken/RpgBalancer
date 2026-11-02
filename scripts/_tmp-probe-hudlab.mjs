import { chromium } from 'playwright';
const url = process.argv[2] ?? 'http://127.0.0.1:5173/hud-lab';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 600)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) {
  const done = await p.evaluate(() => !!document.querySelector('canvas') && !document.body.innerText.includes('loading map'));
  if (done) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(3000);
await p.keyboard.press('h').catch(() => {});
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/hudlab-full.png' });
// zoom on northern massif
await p.mouse.move(760, 200);
for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/hudlab-zoom.png' });
await b.close();
