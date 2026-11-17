/* R-339/PLAN-119 T2 lab witness — /hud-compose?comp=cassetto mounts
 * HudRealCassettoHost → ExpeditionDrawer: witness blocks, fold chip,
 * collapsed chip, restore (same component /game mounts). */
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
try {
  await page.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 20000 });
  const ok = await page.waitForSelector('[data-hudreal-cassetto]', { timeout: 30000 }).then(() => true).catch(() => false);
  if (!ok) { console.log('cassetto never mounted'); }
  else {
    await page.waitForTimeout(600);
    const expanded = await evalSafe(() => ({
      drawer: !!document.querySelector('[data-testid="expedition-drawer"]'),
      blocks: [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block')),
      costSlot: !!document.querySelector('[data-testid="cassetto-cost-slot"]'),
      foldChipRight: document.querySelector('[data-testid="expedition-drawer-collapse"]')?.style.right ?? null,
    }));
    console.log('EXPANDED:', JSON.stringify(expanded));
    await page.screenshot({ path: 'test-results/r339-t2-lab-expanded.png' }).catch(() => {});
    /* The lab's own fixtures (debug roster strip, POI card) occlude both
     *  chips — hide whatever sits on top of a chip for a clean witness of
     *  the chip's own look (occluders hidden only for the shot). */
    await evalSafe(() => {
      const chip = document.querySelector('[data-testid="expedition-drawer-collapse"]');
      const r = chip.getBoundingClientRect();
      for (const el of document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)) {
        if (chip.contains(el) || el === chip) break;
        el.style.visibility = 'hidden';
      }
    });
    await page.locator('[data-testid="expedition-drawer-collapse"]').screenshot({ path: 'test-results/r339-t2-lab-foldchip.png' }).catch(() => {});
    await evalSafe(() => document.querySelectorAll('[style*="visibility: hidden"], [style*="visibility:hidden"]').forEach((el) => { el.style.visibility = ''; }));
    /* DOM click: the lab's debug roster strip (x 740–1040) overlays the fold
     *  chip, so a coordinate click would hit it — a lab-only occlusion, not
     *  a drawer defect (the unit test drives the same handler). */
    await page.evaluate(() => document.querySelector('[data-testid="expedition-drawer-collapse"]')?.click()).catch(() => {});
    await page.waitForTimeout(400);
    const folded = await evalSafe(() => {
      const chip = document.querySelector('[data-testid="expedition-drawer-expand"]');
      const rect = chip?.getBoundingClientRect();
      return {
        cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
        expandChip: !!chip,
        chipRect: rect ? { right: Math.round(rect.right), w: Math.round(rect.width), h: Math.round(rect.height) } : null,
      };
    });
    console.log('FOLDED:', JSON.stringify(folded));
    await page.screenshot({ path: 'test-results/r339-t2-lab-chip.png' }).catch(() => {});
    /* Same occluder dance for the edge chip (the lab POI card sits over it). */
    await evalSafe(() => {
      const chip = document.querySelector('[data-testid="expedition-drawer-expand"]');
      const r = chip.getBoundingClientRect();
      for (const el of document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)) {
        if (chip.contains(el) || el === chip) break;
        el.style.visibility = 'hidden';
      }
    });
    await page.locator('[data-testid="expedition-drawer-expand"]').screenshot({ path: 'test-results/r339-t2-lab-edgechip.png' }).catch(() => {});
    await page.evaluate(() => document.querySelector('[data-testid="expedition-drawer-expand"]')?.click()).catch(() => {});
    await page.waitForTimeout(400);
    const restored = await evalSafe(() => ({
      cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
      confirm: !!document.querySelector('[data-testid="cassetto-confirm"]'),
    }));
    console.log('RESTORED:', JSON.stringify(restored));
    await page.screenshot({ path: 'test-results/r339-t2-lab-restored.png' }).catch(() => {});
  }
} catch (e) { console.log('probe died:', String(e).slice(0, 120)); }
await b.close().catch(() => {});
