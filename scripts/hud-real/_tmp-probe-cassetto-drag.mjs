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
await page.waitForTimeout(600);
// find a draggable resident card in the roster
const dragSel = await page.evaluate(() => {
  const cands = [...document.querySelectorAll('[data-resident-id], [data-draggable], [draggable="true"], [data-testid*="resident-card"], [data-testid*="roster"]')];
  return cands.slice(0, 10).map((e) => ({ tag: e.tagName, tid: e.dataset.testid, rid: e.dataset.residentId, cls: (e.className + '').slice(0, 60) }));
});
console.log('drag candidates:', JSON.stringify(dragSel, null, 0).slice(0, 1200));
// find the slot drop targets in the cassetto
const slotInfo = await page.evaluate(() => {
  const rack = document.querySelector('[data-hudreal-cassetto] [data-testid="resident-slot-rack"]');
  if (!rack) return 'no rack';
  const kids = [...rack.querySelectorAll('[data-slot-id], [data-testid^="slot"], [role="button"], button, div')].slice(0, 12);
  return kids.map((e) => ({ tid: e.dataset.testid, sid: e.dataset.slotId })).filter((x) => x.tid || x.sid).slice(0, 8);
});
console.log('slot targets:', JSON.stringify(slotInfo));
await page.screenshot({ path: 'test-results/cassetto-pre-drag.png' });
console.log('errors:', errors.length);
await b.close();
