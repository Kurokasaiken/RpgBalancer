import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('canvas', { timeout: 40000 }).catch(() => {});
const poiSel = '[data-quest-poi-id="poi-goblin"]';
await page.waitForTimeout(4000);
await page.waitForSelector(poiSel, { state: 'visible', timeout: 60000 }).catch(async () => {
  const st = await page.evaluate(() => {
    const el = document.querySelector('[data-quest-poi-id="poi-goblin"]');
    if (!el) return 'absent';
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return `opacity=${cs.opacity} pointerEvents=${cs.pointerEvents} rect=${r.x},${r.y},${r.width}x${r.height}`;
  });
  console.log('poi state:', st);
});
const box = await page.locator(poiSel).first().boundingBox();
console.log('poi box:', JSON.stringify(box));
await page.screenshot({ path: 'test-results/cassetto-game-before.png' });
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
const opened = await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 8000 }).then(() => true).catch(() => false);
console.log('cassetto opened:', opened);
if (!opened) {
  // check if the stock detail opened instead (wiring regression signal)
  const detail = await page.locator('[data-testid="quest-expedition-detail"], [class*="QuestExpeditionDetail"]').count();
  console.log('stock detail count:', detail);
  await page.screenshot({ path: 'test-results/cassetto-game-fail.png' });
  const detailTestIds = await page.evaluate(() => [...document.querySelectorAll('[data-testid]')].map(e=>e.getAttribute('data-testid')).filter(x=>x&&/quest|exped|poi|cassetto/i.test(x)).slice(0,40));
  console.log('detail testids:', JSON.stringify(detailTestIds));
  console.log('errors:', errors.length, errors.slice(0,8));
  await b.close(); process.exit(1);
}
await page.waitForTimeout(900);
const info = await page.evaluate(() => {
  const c = document.querySelector('[data-hudreal-cassetto]');
  const texts = c ? [...c.querySelectorAll('span')].map((s) => s.textContent.trim()).filter(Boolean) : [];
  return {
    slots: c ? c.querySelectorAll('[data-slot-id], [data-testid^="resident-slot"]').length : 0,
    loadout: c ? c.querySelectorAll('[data-testid^="cassetto-loadout-"]').length : 0,
    confirm: !!c?.querySelector('[data-testid="cassetto-confirm"]'),
    confirmDisabled: c?.querySelector('[data-testid="cassetto-confirm"]')?.disabled ?? null,
    texts: texts.slice(0, 30),
  };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'test-results/cassetto-game-open.png' });
console.log('errors:', errors.length, errors.slice(0, 5));
await b.close();
