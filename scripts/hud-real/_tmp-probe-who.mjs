import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0 && typeof window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail === 'function' && document.querySelectorAll('[data-testid="game-boot-screen"]').length === 0, null, { timeout: 150000, polling: 1000 });
await page.waitForTimeout(1000);
console.log('picker at boot:', await page.locator('[data-testid="drag-test-container"]').count());
await page.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].openDetail());
await page.waitForSelector('[data-hudreal-cassetto]', { state: 'attached', timeout: 10000 });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="drag-test-container"]');
  if (!el) return { found: false };
  const chain = [];
  let n = el;
  while (n && chain.length < 10) {
    const tid = n.getAttribute?.('data-testid');
    const panel = n.getAttribute?.('data-panel');
    chain.push(n.tagName + (tid ? '#' + tid : '') + (panel ? `[panel=${panel}]` : '') + '.' + String(n.className).slice(0, 40));
    n = n.parentElement;
  }
  const r = el.getBoundingClientRect();
  return { found: true, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, chain };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
