import { chromium } from 'playwright';
const url = 'http://localhost:5173/hud-compose?comp=cassetto';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
for (let i = 0; i < 40; i++) {
  const ok = await p.evaluate(() => !!document.querySelector('[data-cassetto-bag]'));
  if (ok) break;
  await p.waitForTimeout(1500);
}
await p.evaluate(() => document.fonts.ready).catch(() => {});
const info = await p.evaluate(() => ({
  slots: [...document.querySelectorAll('[data-testid^="bag-slot-"]')].map(e => e.getAttribute('data-testid')),
  items: [...document.querySelectorAll('[data-testid^="loadout-item-"]')].map(e => e.getAttribute('data-testid')),
}));
console.log(JSON.stringify(info));
// click the first empty slot → lab binds the stash owner
await p.click('[data-testid="bag-slot-empty-0"]').catch(e => console.log('click fail', String(e).slice(0,120)));
await p.waitForTimeout(400);
// simulate a stash assign through the ledger? Not reachable from page — instead verify via UI after real flow on /game.
const bag = await p.$('[data-cassetto-bag]');
const box = bag && await bag.boundingBox();
console.log('bag box:', JSON.stringify(box));
if (box) await p.screenshot({ path: '/tmp/r337-bag.png', clip: { x: box.x - 40, y: box.y - 40, width: box.width + 80, height: box.height + 80 }, timeout: 15000 });
await p.screenshot({ path: '/tmp/r337-cassetto.png', clip: { x: 900, y: 0, width: 540, height: 900 }, timeout: 15000 });
await b.close();
