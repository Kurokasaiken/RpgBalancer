import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const OUT = 'test-results/witness-perquest';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const CASES = [
  { poi: 'poi-goblin', w: 1440, h: 900, tag: '1440x900' },
  { poi: 'poi-rovine', w: 1440, h: 900, tag: '1440x900' },
  { poi: 'poi-goblin', w: 1440, h: 1400, tag: '1440x1400' },
];
for (const { poi, w, h, tag } of CASES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => console.log(`[${poi}] PAGEERROR`, String(e).slice(0, 200)));
  await page.goto(`http://localhost:5173/hud-compose?comp=cassetto&poi=${poi}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('[data-testid="expedition-drawer"], [data-cassetto-debug]', { timeout: 30000 }).catch(() => null);
  const sel = await page.$('[data-cassetto-debug="select-first"]');
  if (sel) { await page.evaluate((el) => el.click(), sel); await page.waitForTimeout(3000); }
  const exp = await page.$('[data-testid="expedition-drawer-expand"]');
  if (exp) { await exp.click(); await page.waitForTimeout(900); }
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => { const c = document.querySelector('[data-hudreal-cassetto]'); return {
    colW: Math.round(c?.getBoundingClientRect().width ?? 0),
    bagSlots: c?.querySelectorAll('[data-testid^="bag-slot-"]').length ?? 0,
    deathPct: c?.querySelector('[data-testid="cassetto-death-pct"]')?.textContent ?? null,
    successPct: c?.querySelector('[data-testid="cassetto-success-pct"]')?.textContent ?? null,
  }; });
  console.log(`${poi}@${tag}`, JSON.stringify(info));
  await page.screenshot({ path: `${OUT}/cassetto-${poi}-${tag}.png` });
  const drawer = await page.$('[data-hudreal-cassetto]');
  if (drawer) await drawer.screenshot({ path: `${OUT}/cassetto-${poi}-${tag}-crop.png` });
  await page.close();
}
await browser.close();
console.log('DONE');
