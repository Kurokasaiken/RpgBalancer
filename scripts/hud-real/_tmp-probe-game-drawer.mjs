/* R-339/PLAN-119 T2 witness probe — /game: open the expedition drawer via the
 * POI marker, witness the fold chip + collapsed chip + blocks + insets. */
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
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
    for (let k = 0; k < 5 && !opened; k++) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
      opened = await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 3500 }).then(() => true).catch(() => false);
    }
    if (!opened) { console.log('never opened'); continue; }
    await page.waitForTimeout(700);
    const expanded = await evalSafe(() => {
      const blocks = [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block'));
      const chip = document.querySelector('[data-testid="expedition-drawer-collapse"]');
      const edgeTab = document.querySelector('[data-testid="expedition-edge-tab"]');
      return {
        drawer: !!document.querySelector('[data-testid="expedition-drawer"]'),
        blocks,
        costSlot: !!document.querySelector('[data-testid="cassetto-cost-slot"]'),
        foldChip: chip ? { right: chip.style.right } : null,
        edgeTabVisible: !!edgeTab,
      };
    });
    console.log('EXPANDED:', JSON.stringify(expanded));
    await page.screenshot({ path: 'test-results/r339-t2-drawer-expanded.png' }).catch(() => {});
    /* Fold: click the collapse chip → the column yields to the edge chip. */
    await page.click('[data-testid="expedition-drawer-collapse"]').catch(() => {});
    await page.waitForTimeout(400);
    const folded = await evalSafe(() => {
      const chip = document.querySelector('[data-testid="expedition-drawer-expand"]');
      const rect = chip?.getBoundingClientRect();
      return {
        cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
        expandChip: !!chip,
        chipRect: rect ? { right: Math.round(rect.right), w: Math.round(rect.width) } : null,
      };
    });
    console.log('FOLDED:', JSON.stringify(folded));
    await page.screenshot({ path: 'test-results/r339-t2-drawer-chip.png' }).catch(() => {});
    /* Restore. */
    await page.click('[data-testid="expedition-drawer-expand"]').catch(() => {});
    await page.waitForTimeout(400);
    const restored = await evalSafe(() => ({
      cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
      confirm: !!document.querySelector('[data-testid="cassetto-confirm"]'),
    }));
    console.log('RESTORED:', JSON.stringify(restored));
    await page.screenshot({ path: 'test-results/r339-t2-drawer-restored.png' }).catch(() => {});
    break;
  }
} catch (e) { console.log('probe died:', String(e).slice(0, 120)); }
await b.close().catch(() => {});
