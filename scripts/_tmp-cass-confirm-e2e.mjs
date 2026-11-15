import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
p.on('console', m => { const t = m.text(); if (t.includes('[cassetto-host]')) console.log('  ', t.slice(0, 160)); });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(1500);
const state = () => p.evaluate(() => ({
  open: document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'),
  canSend: document.querySelector('[data-can-send]')?.getAttribute('data-can-send'),
  assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
  disabled: document.querySelector('[data-testid="cassetto-confirm"]')?.disabled,
}));
console.log('initial:', JSON.stringify(await state()));
// fill slots via real click-to-assign path (dbg button fires handleResidentSelect)
for (let i = 0; i < 6; i++) {
  const s = await state();
  if (s.canSend === 'true') break;
  await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]').click());
  await p.waitForTimeout(900);
  console.log(`after dbg ${i+1}:`, JSON.stringify(await state()));
}
const pre = await state();
console.log('pre-confirm:', JSON.stringify(pre));
if (pre.canSend === 'true' && pre.disabled === false) {
  await p.click('[data-testid="cassetto-confirm"]');
  await p.waitForTimeout(1500);
  console.log('post-confirm:', JSON.stringify(await state()));
} else {
  console.log('CANNOT TEST CONFIRM — canSend still false');
}
await p.screenshot({ path: '/tmp/cass-confirm-e2e.png' });
await b.close();
