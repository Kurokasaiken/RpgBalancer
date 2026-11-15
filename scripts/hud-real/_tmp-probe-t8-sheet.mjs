/* R-339/PLAN-119 T8 witness probe — /game at a NARROW viewport (1024×800,
 * inside the ≤1100 band): open the expedition surface via the POI marker,
 * witness the non-modal bottom sheet (detents, no lateral surfaces, CTA row).
 * Retry+reload pattern for the shared-worktree HMR storm (T-13). */
import { chromium } from 'playwright';
const W = 1024, H = 800;
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: W, height: H } });
const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
const deadline = Date.now() + 420000;
let opened = false;
try {
  while (Date.now() < deadline && !opened) {
    try { await page.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 15000 }); }
    catch { await page.waitForTimeout(1500); continue; }
    let ready = false;
    for (let i = 0; i < 100 && !ready; i++) {
      const s = await evalSafe(() => ({
        veil: !!document.querySelector('[data-testid="game-boot-screen"], #game-boot-screen'),
        r: document.querySelector('[data-map-ready]')?.getAttribute('data-map-ready') ?? null,
      }));
      if (s === null) { await page.waitForTimeout(1500); continue; }
      if (!s.veil && s.r === '') { ready = true; break; }
      await page.waitForTimeout(1500);
    }
    if (!ready) { console.log('no ready this round'); continue; }
    /* Lateral exclusion witness BEFORE any quest is selected: the edge tab
     *  must not mount in this band. */
    const pre = await evalSafe(() => ({
      edgeTab: !!document.querySelector('[data-testid="expedition-edge-tab"]'),
      vw: window.innerWidth,
    }));
    console.log('PRE-QUEST:', JSON.stringify(pre));
    const box = await page.locator('[data-quest-poi-id="poi-goblin"]:visible').first().boundingBox().catch(() => null);
    if (!box) { console.log('no poi'); continue; }
    for (let k = 0; k < 5 && !opened; k++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
      opened = await page.waitForSelector('[data-testid="expedition-sheet"]', { timeout: 3500 }).then(() => true).catch(() => false);
    }
    if (!opened) { console.log('never opened'); continue; }
    await page.waitForTimeout(700);
    const peek = await evalSafe(() => {
      const sheet = document.querySelector('[data-testid="expedition-sheet"]');
      const r = sheet?.getBoundingClientRect();
      return {
        sheet: !!sheet,
        detent: sheet?.getAttribute('data-detent'),
        rect: r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) } : null,
        cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
        drawer: !!document.querySelector('[data-testid="expedition-drawer"]'),
        chips: !!document.querySelector('[data-testid="expedition-drawer-collapse"], [data-testid="expedition-drawer-expand"]'),
        edgeTab: !!document.querySelector('[data-testid="expedition-edge-tab"]'),
        confirm: !!document.querySelector('[data-testid="cassetto-confirm"]'),
        blocks: [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block')),
        peWrapper: getComputedStyle(document.querySelector('[data-testid="expedition-sheet-portal"]')).pointerEvents,
      };
    });
    console.log('PEEK:', JSON.stringify(peek));
    await page.screenshot({ path: 'test-results/r339-t8-sheet-peek-1024.png' }).catch(() => {});
    /* Expand via the chevron → half detent. */
    await page.click('[data-testid="expedition-sheet-toggle"]').catch(() => {});
    await page.waitForTimeout(500);
    const half = await evalSafe(() => {
      const sheet = document.querySelector('[data-testid="expedition-sheet"]');
      const r = sheet?.getBoundingClientRect();
      return {
        detent: sheet?.getAttribute('data-detent'),
        h: r ? Math.round(r.height) : null,
        confirm: !!document.querySelector('[data-testid="cassetto-confirm"]'),
        rack: !!document.querySelector('[data-testid="resident-slot-rack"]'),
        body: !!document.querySelector('[data-testid="expedition-sheet-body"]'),
      };
    });
    console.log('HALF:', JSON.stringify(half));
    await page.screenshot({ path: 'test-results/r339-t8-sheet-half-1024.png' }).catch(() => {});
    /* Full detent via store is not reachable from the page — witness half+peek
     *  and the drag affordance: drag the handle strip upward. */
    const sheetBox = await page.locator('[data-testid="expedition-sheet-handle"]').boundingBox().catch(() => null);
    if (sheetBox) {
      await page.mouse.move(sheetBox.x + sheetBox.width / 2, sheetBox.y + sheetBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(sheetBox.x + sheetBox.width / 2, sheetBox.y - 500, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(400);
      const afterDrag = await evalSafe(() => ({
        detent: document.querySelector('[data-testid="expedition-sheet"]')?.getAttribute('data-detent'),
        h: Math.round(document.querySelector('[data-testid="expedition-sheet"]')?.getBoundingClientRect().height ?? -1),
      }));
      console.log('AFTER-DRAG:', JSON.stringify(afterDrag));
      await page.screenshot({ path: 'test-results/r339-t8-sheet-dragged-1024.png' }).catch(() => {});
    }
    break;
  }
} catch (e) { console.log('probe died:', String(e).slice(0, 120)); }
await b.close().catch(() => {});
