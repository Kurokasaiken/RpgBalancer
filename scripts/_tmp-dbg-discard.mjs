import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0,200)));
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('#root > *', { state: 'attached', timeout: 45000 });
for (let i = 0; i < 20; i++) {
  if (await p.locator('[data-testid="expedition-drawer-expand"], [data-hudreal-cassetto]').count()) break;
  await p.waitForTimeout(1000);
}
console.log('expand chip:', await p.locator('[data-testid="expedition-drawer-expand"]').count());
const eb = p.locator('[data-testid="expedition-drawer-expand"]');
if (await eb.count()) { await eb.click(); await p.waitForTimeout(1200); }
console.log('column:', await p.locator('[data-hudreal-cassetto]').count());
await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]')?.click());
await p.waitForTimeout(5000);
const s1 = await p.evaluate(() => ({
  assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
  open: document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'),
}));
console.log('before:', JSON.stringify(s1));
await p.click('[data-testid="cassetto-close"]');
await p.waitForTimeout(400);
const s2 = await p.evaluate(() => ({
  assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
  open: document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'),
  flightProxy: document.querySelectorAll('[data-flight-proxy], [class*="flight"]').length,
}));
console.log('after400:', JSON.stringify(s2));
await p.waitForTimeout(2600);
const s3 = await p.evaluate(() => ({
  assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
  open: document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'),
}));
console.log('after3000:', JSON.stringify(s3));
await b.close();
