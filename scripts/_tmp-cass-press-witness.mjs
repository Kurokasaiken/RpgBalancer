import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(2000);
// fill leader so canSend → enabled button (else hover rules don't fire)
await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]').click());
for (let i = 0; i < 14; i++) {
  await p.waitForTimeout(1000);
  if ((await p.evaluate(() => document.querySelector('[data-can-send]')?.getAttribute('data-can-send'))) === 'true') break;
}
console.log('canSend:', await p.evaluate(() => document.querySelector('[data-can-send]')?.getAttribute('data-can-send')));
const btn = await p.locator('[data-testid="cassetto-confirm"]');
const bb = await btn.boundingBox();
const clip = { x: bb.x - 30, y: bb.y - 40, width: bb.width + 60, height: bb.height + 80 };
await p.screenshot({ path: '/tmp/press-idle.png', clip });
await btn.hover(); await p.waitForTimeout(250);
await p.screenshot({ path: '/tmp/press-hover.png', clip });
await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await p.mouse.down(); await p.waitForTimeout(120);
await p.screenshot({ path: '/tmp/press-down.png', clip });
await p.mouse.up();
// bag slot hover
const bag = await p.locator('[data-testid="bag-slot-empty-0"]');
const gb = await bag.boundingBox();
await bag.hover(); await p.waitForTimeout(250);
await p.screenshot({ path: '/tmp/bag-hover.png', clip: { x: gb.x - 40, y: gb.y - 40, width: 200, height: 130 } });
await b.close();
