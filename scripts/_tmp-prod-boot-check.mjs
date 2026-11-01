import { chromium } from 'playwright';
const url = process.argv[2] ?? 'https://rpg-balancer.vercel.app/game';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
p.on('console', m => { const t = m.text(); if (m.type() === 'error' || /packRoot|error|fail/i.test(t)) console.log(`[${m.type()}]`, t.slice(0, 300)); });
p.on('pageerror', e => console.log('[pageerror]', String(e.stack ?? e).slice(0, 1200)));
p.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText));
await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForTimeout(25000);
const state = await p.evaluate(() => ({
  alert: document.querySelector('[role="alert"]')?.textContent ?? null,
  bootPhase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
  canvas: !!document.querySelector('canvas'),
}));
console.log('STATE', JSON.stringify(state));
await p.screenshot({ path: 'test-results/prod-game-boot.png' });
await b.close();
