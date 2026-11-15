/* R-339/PLAN-119 T3-S2 witness probe — /game?poiDemo=1:
 * open the POI planner (drawer + real Detail adapter → costPreview),
 * then click an empty bag slot → bound stash shelf rows must carry
 * data-assign-state markers. Tolerates HMR reloads by re-entering. */
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
const deadline = Date.now() + 300000;
let done = false;
try {
  while (Date.now() < deadline && !done) {
    try { await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 15000 }); }
    catch { await page.waitForTimeout(1500); continue; }
    let ready = false;
    for (let i = 0; i < 80 && !ready; i++) {
      const s = await evalSafe(() => ({
        veil: !!document.querySelector('[data-testid="game-boot-screen"]'),
        r: document.querySelector('[data-map-ready]')?.getAttribute('data-map-ready') ?? null,
      }));
      if (s === null) { await page.waitForTimeout(1500); continue; }
      if (!s.veil && s.r === '') { ready = true; break; }
      await page.waitForTimeout(1500);
    }
    if (!ready) { console.log('no ready this round'); continue; }
    const box = await page.locator('[data-quest-poi-id="poi-goblin"]:visible').first().boundingBox().catch(() => null);
    if (!box) { console.log('no poi'); continue; }
    let opened = false;
    for (let k = 0; k < 5 && !opened; k++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
      opened = await page.waitForSelector('[data-testid="cassetto-cost-slot"]', { timeout: 3500 }).then(() => true).catch(() => false);
    }
    if (!opened) { console.log('drawer never opened'); continue; }
    await page.waitForTimeout(600);
    const cost = await evalSafe(() => {
      const cell = document.querySelector('[data-testid="cassetto-cost-slot"]');
      const value = document.querySelector('[data-testid="cassetto-cost-value"]');
      return {
        placeholder: cell?.getAttribute('data-placeholder'),
        label: cell?.querySelector('span')?.textContent ?? null,
        value: value?.textContent ?? null,
        tone: value?.getAttribute('data-tone') ?? null,
        pointerEvents: cell ? getComputedStyle(cell).pointerEvents : null,
      };
    });
    console.log('GAME-COST-CELL:', JSON.stringify(cost));
    /* Click an empty bag slot → the bound magazzino opens. */
    const slot = await page.locator('[data-testid^="bag-slot-empty-"]').first().boundingBox().catch(() => null);
    if (slot) {
      await page.mouse.click(slot.x + slot.width / 2, slot.y + slot.height / 2).catch(() => {});
      await page.waitForSelector('[data-stash-mode]', { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(500);
      const stash = await evalSafe(() => {
        const shelf = document.querySelector('[data-stash-mode]');
        const states = [...document.querySelectorAll('[data-assign-state]')].map((el) => ({
          id: el.getAttribute('data-testid'),
          state: el.getAttribute('data-assign-state'),
        }));
        return {
          mode: shelf?.getAttribute('data-stash-mode') ?? null,
          rows: states.slice(0, 8),
          hint: !!document.querySelector('[data-testid="stash-bag-full-hint"]'),
        };
      });
      console.log('GAME-STASH:', JSON.stringify(stash));
      await page.screenshot({ path: 'test-results/r339-t3s2-game-stash.png' }).catch(() => {});
    } else {
      console.log('no empty bag slot found');
    }
    await page.screenshot({ path: 'test-results/r339-t3s2-game-drawer.png' }).catch(() => {});
    done = true;
  }
} finally {
  console.log('probe done:', done);
  await b.close();
}
