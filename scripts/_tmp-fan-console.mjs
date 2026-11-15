import { chromium } from 'playwright';
const b = await chromium.connectOverCDP('http://localhost:9222', { timeout: 60000 });
const ctx = b.contexts()[0];
const p = await ctx.newPage();
const logs = [];
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
p.on('pageerror', e => logs.push(`[pageerror] ${String(e).slice(0, 300)}`));
await p.goto('http://127.0.0.1:5173/lab/poi-luogo', { waitUntil: 'domcontentloaded', timeout: 120000 });
for (let i = 0; i < 24; i++) {
  const has = await p.locator('[data-testid="place-village-hit"]').count();
  const ready = await p.evaluate(() => document.readyState);
  console.error(`t=${(i + 1) * 5}s hit=${has} ready=${ready} logs=${logs.length}`);
  if (has) break;
  await p.waitForTimeout(5000);
}
logs.slice(0, 15).forEach(l => console.error(l));
console.error('done');
await p.close();
await b.close();
