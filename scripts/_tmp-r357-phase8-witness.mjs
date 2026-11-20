/* _tmp-r357-phase8-witness.mjs — T-04 headless witness for PLAN-125 Phase 8:
 * cassetto drawer on /hud-compose (real session via HudRealCassettoHost).
 * Viewports: 1440x900, 1280x800 (lateral drawer), 1050x900 (<=1100 sheet).
 * Captures: full frames + zoomed crops (close X, risk&rewards %, corners,
 * fold chip) + behavioural check of the discard (seats clear + bag release).
 * NOTE: `data-block` wrappers are display:contents (no box) — crops clip on
 * the inner visible testids instead. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const OUT = 'test-results/r357-phase8-witness';
mkdirSync(OUT, { recursive: true });

const launch = () => chromium.launch({ args: ['--enable-unsafe-swiftshader'] });

async function shot(page, name, clip) {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...(clip ? { clip } : {}) });
  console.log('[shot]', name);
}

async function untilMounted(page, tag) {
  /* Boot is slow under vite dev cold transform — poll for either surface. */
  for (let i = 0; i < 30; i++) {
    const col = await page.locator('[data-hudreal-cassetto]').count();
    const chip = await page.locator('[data-testid="expedition-drawer-expand"]').count();
    const sheet = await page.locator('[data-expedition-sheet]').count();
    if (col || chip || sheet) return { col, chip, sheet };
    await page.waitForTimeout(1000);
  }
  console.log(`[${tag}] nothing mounted after 30s`);
  return { col: 0, chip: 0, sheet: 0 };
}

async function clipOf(page, sel, pad = 14, vp) {
  const el = page.locator(sel).first();
  if (!(await el.count())) return null;
  const b = await el.boundingBox();
  if (!b) return null;
  const c = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 };
  if (c.x + c.width > vp.width) c.width = vp.width - c.x;
  if (c.y + c.height > vp.height) c.height = vp.height - c.y;
  return c;
}

async function capture(width, height, tag) {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', (e) => console.error('[pageerror]', String(e).slice(0, 220)));
  await page.goto(`${BASE}/hud-compose?comp=cassetto`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  const m = await untilMounted(page, tag);
  console.log(`[${tag}] mounted:`, JSON.stringify(m));

  if (m.chip && !m.col) {
    await page.locator('[data-testid="expedition-drawer-expand"]').click();
    await page.waitForTimeout(1200);
    m.col = await page.locator('[data-hudreal-cassetto]').count();
  }

  if (m.col) {
    /* Fill a seat through the REAL session path -> sim computes -> % readouts. */
    await page.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]')?.click());
    await page.waitForTimeout(5000);
    await shot(page, `${tag}-drawer-full`);

    for (const [name, sel, pad] of [
      [`${tag}-crop-close`, '[data-testid="cassetto-close"]', 50],
      [`${tag}-crop-risk`, '[data-testid="cassetto-risk-value"]', 80],
      [`${tag}-crop-rewards`, '[data-testid="cassetto-success-pct"], [data-testid="cassetto-rewards"]', 80],
      [`${tag}-crop-foldchip`, '[data-testid="expedition-drawer-collapse"]', 40],
      [`${tag}-crop-journey`, '[data-testid="cassetto-journey-total"]', 90],
      [`${tag}-crop-cta`, '[data-testid="cassetto-confirm"]', 40],
    ]) {
      const c = await clipOf(page, sel, pad, { width, height });
      if (c) await shot(page, name, c);
      else console.log(`[${tag}] crop skipped (no box): ${sel}`);
    }

    /* Discard behavioural witness: the deferred clear commit lands within a
     *  few seconds under headless (startTransition + flight commit). */
    const before = await page.evaluate(() => document.querySelector('[data-assigned]')?.getAttribute('data-assigned'));
    await page.locator('[data-testid="cassetto-close"]').click();
    await page.waitForTimeout(3200);
    const after = await page.evaluate(() => document.querySelector('[data-assigned]')?.getAttribute('data-assigned'));
    const openAfter = await page.evaluate(() => document.querySelector('[data-detail-open]')?.getAttribute('data-detail-open'));
    console.log(`[${tag}] discard: assigned ${before} -> ${after}, detailOpen=${openAfter}`);
    await shot(page, `${tag}-after-close`);
  } else if (m.sheet) {
    await page.evaluate(() => document.querySelector('[data-cassetto-debug="select-first"]')?.click());
    await page.waitForTimeout(5000);
    await shot(page, `${tag}-sheet-full`);
    const c = await clipOf(page, '[data-expedition-sheet]', 8, { width, height });
    if (c) await shot(page, `${tag}-sheet-zoom`, c);
    const cb = await clipOf(page, '[data-testid="cassetto-close"]', 80, { width, height });
    if (cb) await shot(page, `${tag}-sheet-crop-close`, cb);
    const cr = await clipOf(page, '[data-testid="cassetto-risk-value"]', 80, { width, height });
    if (cr) await shot(page, `${tag}-sheet-crop-risk`, cr);
  } else {
    await shot(page, `${tag}-empty`);
  }
  await browser.close();
}

await capture(1440, 900, 'w1440');
await capture(1280, 800, 'w1280');
await capture(1050, 900, 'w1050');
console.log('done');
