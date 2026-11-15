import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
p.on('console', m => { const t = m.text(); if (t.includes('[cassetto-host]') || t.includes('expedition')) console.log('  ', t.slice(0, 200)); });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 });
await p.waitForTimeout(2000);
const state = () => p.evaluate(() => ({
  open: document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'),
  canSend: document.querySelector('[data-can-send]')?.getAttribute('data-can-send'),
  assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
  disabled: document.querySelector('[data-testid="cassetto-confirm"]')?.disabled,
  btnOpacity: getComputedStyle(document.querySelector('[data-testid="cassetto-confirm"]')).opacity,
}));
await p.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]').click());
for (let i = 0; i < 12; i++) { await p.waitForTimeout(1000); const s = await state(); if (s.canSend === 'true') { console.log(`canSend at t+${i+1}s:`, JSON.stringify(s)); break; } }
await p.screenshot({ path: '/tmp/cass-pre-launch.png' });
await p.click('[data-testid="cassetto-confirm"]');
console.log('clicked CONFIRM');
for (let i = 0; i < 6; i++) { await p.waitForTimeout(1000); console.log(`post t+${i+1}s:`, JSON.stringify(await state())); }
await p.screenshot({ path: '/tmp/cass-post-launch.png' });
await b.close();
