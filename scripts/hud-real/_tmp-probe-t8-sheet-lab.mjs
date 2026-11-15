/* R-339/PLAN-119 T8 witness probe (lab fallback) — /hud-compose?comp=cassetto
 * at a NARROW viewport (1024×800): the lab mounts the same ExpeditionDrawer,
 * so the ≤1100 band must render the bottom sheet, never the column/chips. */
import { chromium } from 'playwright';
const W = 1024, H = 800;
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: W, height: H } });
const evalSafe = (fn) => page.evaluate(fn).catch(() => null);
try {
  await page.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('[data-testid="expedition-sheet"], [data-hudreal-cassetto]', { timeout: 30000 });
  await page.waitForTimeout(900);
  const peek = await evalSafe(() => {
    const sheet = document.querySelector('[data-testid="expedition-sheet"]');
    const r = sheet?.getBoundingClientRect();
    const handle = document.querySelector('[data-testid="expedition-sheet-handle"]');
    return {
      sheet: !!sheet,
      detent: sheet?.getAttribute('data-detent'),
      rect: r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) } : null,
      handleH: handle ? Math.round(handle.getBoundingClientRect().height) : null,
      cassetto: !!document.querySelector('[data-hudreal-cassetto]'),
      drawer: !!document.querySelector('[data-testid="expedition-drawer"]'),
      chips: !!document.querySelector('[data-testid="expedition-drawer-collapse"], [data-testid="expedition-drawer-expand"]'),
      confirm: !!document.querySelector('[data-testid="cassetto-confirm"]'),
      blocks: [...document.querySelectorAll('[data-block]')].map((el) => el.getAttribute('data-block')),
      peWrapper: getComputedStyle(document.querySelector('[data-testid="expedition-sheet-portal"]')).pointerEvents,
      peSheet: sheet ? getComputedStyle(sheet).pointerEvents : null,
      vw: window.innerWidth,
    };
  });
  console.log('PEEK:', JSON.stringify(peek));
  await page.screenshot({ path: 'test-results/r339-t8-sheet-peek-lab-1024.png' }).catch(() => {});
  await page.click('[data-testid="expedition-sheet-toggle"]').catch(() => {});
  await page.waitForTimeout(500);
  const half = await evalSafe(() => {
    const sheet = document.querySelector('[data-testid="expedition-sheet"]');
    const r = sheet?.getBoundingClientRect();
    return {
      detent: sheet?.getAttribute('data-detent'),
      h: r ? Math.round(r.height) : null,
      expected: Math.round(window.innerHeight * 0.5),
      confirm: !!document.querySelector('[data-testid="cassetto-confirm"]'),
      body: !!document.querySelector('[data-testid="expedition-sheet-body"]'),
      journeyTotal: !!document.querySelector('[data-testid="cassetto-journey-total"]'),
      costSlot: !!document.querySelector('[data-testid="cassetto-cost-slot"]'),
    };
  });
  console.log('HALF:', JSON.stringify(half));
  await page.screenshot({ path: 'test-results/r339-t8-sheet-half-lab-1024.png' }).catch(() => {});
  /* Drag affordance: drag the handle strip upward from half → full. */
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
      expected: Math.round(window.innerHeight * 0.92),
    }));
    console.log('AFTER-DRAG:', JSON.stringify(afterDrag));
    await page.screenshot({ path: 'test-results/r339-t8-sheet-full-lab-1024.png' }).catch(() => {});
  }
} catch (e) { console.log('probe died:', String(e).slice(0, 160)); }
await b.close().catch(() => {});
