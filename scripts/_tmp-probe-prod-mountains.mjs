import { chromium } from 'playwright';
const url = process.argv[2] ?? 'https://rpg-balancer.vercel.app/';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 600)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
for (let i = 0; i < 60; i++) {
  const ready = await p.evaluate(() => document.body.innerText.includes('ready: yes') || !!document.querySelector('canvas'));
  if (ready) break;
  await p.waitForTimeout(2000);
}
await p.waitForTimeout(4000);
await p.keyboard.press('h').catch(() => {});
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/prod-full.png' });
// zoom on the northern massif
await p.mouse.move(800, 260);
for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -240); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/prod-zoom.png' });
await b.close();
