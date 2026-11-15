import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
p.on('console', m => { const t = m.text(); if (t.includes('[cassetto-host]')) console.log('  ', t.slice(0, 200)); });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(2000);
const diag = () => p.evaluate(() => ({
  open: document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'),
  canSend: document.querySelector('[data-can-send]')?.getAttribute('data-can-send'),
  assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
  slotButtons: [...document.querySelectorAll('[data-testid^="slot-button-"]')].map(e => e.getAttribute('data-testid')),
  rackRect: document.querySelector('[data-testid="resident-slot-rack-root"]')?.getBoundingClientRect().toJSON(),
}));
console.log('initial:', JSON.stringify(await diag()));
await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]').click());
for (let i = 0; i < 8; i++) {
  await p.waitForTimeout(1000);
  console.log(`t+${i+1}s:`, JSON.stringify(await diag()));
}
await b.close();
