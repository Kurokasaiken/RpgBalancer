import { chromium } from 'playwright';
const url = process.argv[2];
const waitMs = Number(process.argv[3] ?? 60000);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const fails = [];
p.on('console', m => { const t = m.text(); if (m.type() === 'error') console.log(`[console.error]`, t.slice(0, 300)); });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 1500)));
p.on('requestfailed', r => fails.push(`${r.url()} :: ${r.failure()?.errorText}`));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(waitMs);
const state = await p.evaluate(() => ({
  alert: document.querySelector('[role="alert"]')?.textContent ?? null,
  bootPhase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
  canvas: !!document.querySelector('canvas'),
}));
console.log('STATE', JSON.stringify(state));
console.log('REQFAILS', fails.length, fails.slice(0, 10));
await p.screenshot({ path: `test-results/prod-boot-${url.split('/').pop() || 'root'}.png` });
await b.close();
