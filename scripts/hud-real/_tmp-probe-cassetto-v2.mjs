import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
await page.waitForTimeout(4000);
await page.waitForSelector('[data-quest-poi-id="poi-goblin"]', { state: 'visible', timeout: 60000 });
const click = async (sel) => {
  const box = await page.locator(sel).first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
await click('[data-quest-poi-id="poi-goblin"]');
await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 8000 });
await page.waitForTimeout(800);
const info = await page.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  return {
    bagSlots: c.querySelectorAll('[data-testid^="bag-slot-"]').length,
    emptyPouches: c.querySelectorAll('[data-testid^="bag-slot-empty-"]').length,
    resources: c.querySelectorAll('[data-cassetto-res]').length,
    reason: c.querySelector('[data-testid="cassetto-reason"], [data-cassetto-reason]')?.textContent ?? 'none',
    journeyTotal: c.querySelector('[data-testid="cassetto-journey-total"]')?.textContent ?? 'none',
    texts: [...c.querySelectorAll('span')].map((s) => s.textContent.trim()).filter(Boolean).slice(0, 30),
  };
});
console.log(JSON.stringify(info, null, 1));
// click an empty pouch → bound stash must open
const stashBefore = await page.locator('[data-testid="village-stash-panel"], [class*="VillageStash"]').count();
await click('[data-testid="bag-slot-empty-0"]');
await page.waitForTimeout(700);
const stashInfo = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('[data-testid]')].map((e) => e.dataset.testid).filter((x) => /stash|magazzino|warehouse/i.test(x));
  return cands.slice(0, 10);
});
console.log('stash testids after pouch click:', JSON.stringify(stashInfo), 'stashBefore:', stashBefore);
await page.screenshot({ path: 'test-results/cassetto-game-v2.png' });
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
