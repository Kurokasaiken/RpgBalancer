import { chromium } from 'playwright';
const url = 'http://localhost:5173/game?poiDemo=1';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 40; i++) {
  const ok = await p.evaluate(() => !!document.querySelector('[data-hudreal-time]') && !!document.querySelector('[data-hudreal-nav]'));
  if (ok) { console.log('hud mounted'); break; }
  await p.waitForTimeout(2000);
}
// map-ready never arrives headless (known probe block): lift the boot veil to
// witness the signed bars — DOM/computed state is what we're verifying anyway.
await p.evaluate(() => {
  const veil = document.querySelector('[data-testid="game-boot-screen"]');
  if (veil) veil.style.display = 'none';
});
await p.evaluate(() => document.fonts.ready).catch(() => {});
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/r336-full.png', timeout: 20000 });
for (const slot of ['time', 'nav']) {
  const el = await p.$(`[data-hudslot="${slot}"]`);
  const box = el && await el.boundingBox();
  console.log(slot, 'box:', JSON.stringify(box));
  if (box) await p.screenshot({ path: `/tmp/r336-${slot}.png`, clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: box.width + 20, height: box.height + 20 }, timeout: 20000 });
}
await b.close();
