/**
 * _tmp-reliquary-v2probe.mjs — isolated PLAN-127 V2 probe for
 * HudRealReliquary. The full hud-scale-audit sweep keeps flaking on the
 * director 'legacy' mount choreography under load, leaving stale/hollow
 * cells; this script measures the SAME structural facts on a mounted
 * reliquary at 1280 and 1440 and prints a JSON verdict.
 *
 * Headless only. Requires the canonical dev server on :5173.
 * Usage: node scripts/_tmp-reliquary-v2probe.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.HUD_AUDIT_PORT
  ? `http://localhost:${process.env.HUD_AUDIT_PORT}`
  : 'http://localhost:5173';
const VIEWPORTS = [
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];
const TEXT_FLOOR = 11;
const COL_SEL = '[data-testid^="hudreal-reliquary-col-"]';
const ITEM_SEL = '[data-testid^="hudreal-reliquary-slot-"]';
const PANEL_SEL = '[data-testid="hudreal-reliquary"]';
const STASH_SCROLL_SEL = '[data-testid="stash-shelf"]';
const STASH_PANEL_SEL = '[data-testid="stash-shelf"] >> xpath=ancestor::*[@data-hud-panel][1]';
const STASH_ITEM_SEL = '[data-testid^="stash-item-"]';
const STASH_CLONE_TARGET = 60;
const CLONE_TARGET = 12;
const TOL = 1;

const results = {};

const measure = async (page, colSel, panelSel, itemSel, cloneTarget) => {
  const panel = page.locator(panelSel).first();
  const col = page.locator(colSel).first();

  // text-floor on the whole panel (same walker as v2-invariants).
  const tf = await panel.evaluate((rootEl, floor) => {
    const out = [];
    let checked = 0;
    for (const el of [rootEl, ...rootEl.querySelectorAll('*')]) {
      const hasDirectText = [...el.childNodes].some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      );
      if (!hasDirectText) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') continue;
      if (el.getAttribute('aria-hidden') === 'true') continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 && r.height <= 1) continue;
      checked += 1;
      const px = parseFloat(cs.fontSize);
      if (Number.isFinite(px) && px < floor - 0.01) out.push({ tag: el.tagName, px });
    }
    return { checked, violations: out, min: out.length ? Math.min(...out.map((o) => o.px)) : null };
  }, TEXT_FLOOR);

  // baseline dims BEFORE injection.
  const baseline = await col.evaluate((el) => ({ clientWidth: el.clientWidth, clientHeight: el.clientHeight }));

  // inject clones (mirror injectClones).
  const inj = await col.evaluate((el, { target, itemSel, strings }) => {
    const items = [...el.querySelectorAll(itemSel)];
    const base = items.length;
    let total = base;
    while (total < target) {
      const c = items[(total - base) % base].cloneNode(true);
      c.setAttribute('data-v2audit-clone', String(total));
      el.appendChild(c);
      total += 1;
    }
    return { base, total };
  }, { target: cloneTarget, itemSel, strings: [] });
  await page.waitForTimeout(150);

  // scroll-engagement.
  const se = await col.evaluate((el) => {
    const cs = getComputedStyle(el);
    const orig = el.scrollTop;
    const slack = el.scrollHeight - el.clientHeight;
    const target = slack > 0 ? Math.max(1, Math.floor(slack / 2)) : 0;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = 'auto';
    el.scrollTop = target;
    const rb = el.scrollTop;
    el.scrollTop = orig;
    el.style.scrollBehavior = prev;
    return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, overflowY: cs.overflowY, target, readBack: rb };
  });
  const sePass = se.scrollHeight > se.clientHeight && ['auto', 'scroll'].includes(se.overflowY) && se.target > 0 && se.readBack > 0;

  // no-horizontal-overflow.
  const ho = await col.evaluate((el, tol) => ({ delta: el.scrollWidth - el.clientWidth, overflowX: getComputedStyle(el).overflowX, tol }), TOL);
  const hoPass = ho.delta <= TOL;

  // last-item-reachable.
  await col.evaluate((el) => { el.style.scrollBehavior = 'auto'; el.scrollTop = el.scrollHeight - el.clientHeight; });
  await page.waitForTimeout(200);
  const li = await col.evaluate((el, itemSel) => {
    const last = [...el.querySelectorAll(itemSel)].pop();
    if (!last) return { found: false };
    const ib = last.getBoundingClientRect();
    const cr = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const bottom = cr.bottom - (parseFloat(cs.borderBottomWidth) || 0);
    const top = cr.top + (parseFloat(cs.borderTopWidth) || 0);
    return { found: true, itemBottom: ib.bottom, itemTop: ib.top, top, bottom };
  }, itemSel);
  const liPass = li.found && li.itemBottom > li.top + 2 && li.itemTop < li.bottom - 2 && li.itemBottom <= li.bottom + 2;
  await col.evaluate((el) => { el.scrollTop = 0; });

  // container-dims-stable (inline ?? computed maxHeight, exact helper logic).
  const ds = await col.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      clientWidth: el.clientWidth, clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      computedMaxHeight: cs.maxHeight,
      inlineMaxHeight: el.style.maxHeight || null,
      computedHeight: cs.height,
    };
  });
  const mhVal = ds.inlineMaxHeight ?? ds.computedMaxHeight;
  const mhPx = mhVal && mhVal !== 'none' ? parseFloat(mhVal) : null;
  const bounded = mhPx !== null && Number.isFinite(mhPx);
  const drift = { w: Math.abs(ds.clientWidth - baseline.clientWidth), h: Math.abs(ds.clientHeight - baseline.clientHeight) };
  const dsPass = bounded && ds.clientHeight <= mhPx + TOL && drift.w <= TOL && drift.h <= TOL;

  return {
    baseline, injection: inj,
    'text-floor': { pass: tf.violations.length === 0, checked: tf.checked, min: tf.min, viol: tf.violations.slice(0, 5) },
    'scroll-engagement': { pass: sePass, ...se },
    'no-horizontal-overflow': { pass: hoPass, ...ho },
    'last-item-reachable': { pass: liPass, ...li },
    'container-dims-stable': { pass: dsPass, bounded, mhVal, mhPx, drift, ...ds },
  };
};

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
try {
  await page.goto(BASE);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.locator('[data-testid="game-mappa2"]').waitFor({ state: 'visible', timeout: 45_000 });
  await page.waitForTimeout(1_500);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(350);
    const rel = page.locator(PANEL_SEL);
    // Mount via director 'legacy', up to 3 attempts (same as the sweep).
    for (let i = 0; i < 3 && !(await rel.isVisible().catch(() => false)); i += 1) {
      const dirPanel = page.locator('[data-testid="director-panel"]');
      if (!(await dirPanel.isVisible().catch(() => false))) {
        await page.keyboard.press('d');
        await page.waitForTimeout(300);
      }
      const btn = page.locator('[data-action-id="legacy"]').first();
      if ((await btn.count()) > 0) {
        await btn.click({ timeout: 5_000 }).catch(() => {});
        await page.keyboard.press('d');
        await page.waitForTimeout(150);
      }
      await rel.waitFor({ state: 'visible', timeout: 6_000 }).catch(() => {});
    }
    const mounted = await rel.isVisible().catch(() => false);
    const rec = { mounted, diag: {} };
    if (mounted) {
      // Per-column visibility diagnostics — explains the sweep's
      // "[scroll layer not visible]" flake on .first().
      rec.diag.cols = await page.evaluate((sel) => {
        return [...document.querySelectorAll(sel)].map((el) => ({
          id: el.getAttribute('data-testid'),
          w: el.clientWidth, h: el.clientHeight,
          vis: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
          csMaxH: getComputedStyle(el).maxHeight,
          inlineMaxH: el.style.maxHeight || null,
          overflowY: getComputedStyle(el).overflowY,
        }));
      }, COL_SEL);
      try {
        rec.results = await measure(page, COL_SEL, PANEL_SEL, ITEM_SEL, CLONE_TARGET);
      } catch (e) {
        rec.error = String(e).slice(0, 200);
      }
      // Toggle off.
      const dirPanel = page.locator('[data-testid="director-panel"]');
      if (!(await dirPanel.isVisible().catch(() => false))) { await page.keyboard.press('d'); await page.waitForTimeout(250); }
      await page.locator('[data-action-id="legacy"]').first().click({ timeout: 4_000 }).catch(() => {});
      await page.keyboard.press('d');
      await page.waitForTimeout(150);
    }
    results[`reliquary@${vp.w}`] = rec;

    /* ---- stash (VillageStashPanel) — 'v' toggles the shelf panel ---- */
    const sRec = { mounted: false };
    const shelf = page.locator(STASH_SCROLL_SEL);
    try {
      for (let i = 0; i < 2 && !(await shelf.isVisible().catch(() => false)); i += 1) {
        await page.keyboard.press('v');
        await shelf.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
      }
      sRec.mounted = await shelf.isVisible().catch(() => false);
      if (sRec.mounted) {
        sRec.results = await measure(page, STASH_SCROLL_SEL, STASH_PANEL_SEL, STASH_ITEM_SEL, STASH_CLONE_TARGET);
      }
      // Close (toggle off) — converge on hidden.
      for (let i = 0; i < 2 && (await shelf.isVisible().catch(() => false)); i += 1) {
        await page.keyboard.press('v');
        await page.waitForTimeout(150);
      }
    } catch (e) {
      sRec.error = String(e).slice(0, 200);
    }
    results[`stash@${vp.w}`] = sRec;
  }
} finally {
  await browser.close().catch(() => {});
}
console.log(JSON.stringify(results, null, 2));
