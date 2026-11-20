/**
 * PLAN-127/128 — HUD surface scalability audit (Layer 2 runtime sweep).
 *
 * Structural DOM facts (V2 helpers) measured on every surface reachable on
 * `/game` (dev server, headless Chromium + SwiftShader), at 4 viewport
 * widths (1280/1440/1920/3440) × normal + injected max-content where a list
 * exists. Verdicts are EVIDENCE for the scorecard
 * (`test-results/slicekit/hud-scale-audit.{json,md}`), never hard assertions.
 * The matrix is persisted after EVERY viewport so a mid-sweep failure still
 * leaves the partial evidence on disk.
 *
 * Surfaces: roster (r), ledger (e), stash (v), merchant (m), menu, top
 * chrome, cassetto (POI click after director 'quest' reveal), levelup /
 * reliquary / expeditionLost (director staging actions), memorial (menu).
 * Victory is NOT reachable cheaply — needs `activeQuestRun.run.ended` (a
 * real multi-day run; no staging hook exists — stageExpeditionLost clones
 * the run for the LOST path only). Documented in the report.
 *
 * Run:
 *   npm run dev                        # canonical dev server on :5173
 *   npx playwright test --config tests/vrt/playwright.hud-audit.config.ts
 *   HUD_AUDIT_PORT=5174 …              # when :5173 is occupied by a foreign server
 */

import { test, expect, type Page, type Locator } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  assertScrollEngagement,
  assertTextFloor,
  assertNoHorizontalOverflow,
  assertLastItemReachable,
  assertContainerDimsStable,
  type V2ProbeResult,
  type ContainerDimsBaseline,
} from '../helpers/v2-invariants';

const TEXT_FLOOR_PX = 11;
const RESULTS_DIR = join(process.cwd(), 'test-results', 'slicekit');
const RESULTS_FILE = join(RESULTS_DIR, 'hud-scale-audit.json');

const ALL_VIEWPORTS = [
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
  { w: 1920, h: 1080 },
  { w: 3440, h: 1440 },
] as const;

/** Resumable sweep controls (catch-up passes fill or overwrite cells):
 *   HUD_AUDIT_WIDTHS='1920,3440'   — only these widths run
 *   HUD_AUDIT_SURFACES='lost,memorial' — only surfaces whose id contains one
 *   HUD_AUDIT_MERGE=1              — load the existing JSON and merge cells in
 */
const WIDTHS_FILTER = (process.env.HUD_AUDIT_WIDTHS ?? '')
  .split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n));
const SURF_FILTER = (process.env.HUD_AUDIT_SURFACES ?? '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const MERGE_EXISTING = process.env.HUD_AUDIT_MERGE === '1';
const VIEWPORTS = ALL_VIEWPORTS.filter((v) => WIDTHS_FILTER.length === 0 || WIDTHS_FILTER.includes(v.w));
const want = (surfaceId: string) =>
  SURF_FILTER.length === 0 || SURF_FILTER.some((f) => surfaceId.toLowerCase().includes(f));

const ADVERSARIAL_STRINGS = [
  'Alessandro della Lunga Veglia Notturna del Presidio Orientale',
  'Sentinella-Della-Lunga-Veglia-Notturna-E-Oltre-I-Confini-Del-Regno',
];

/** What the audit measured for one surface at one viewport. */
interface SurfaceProbeRecord {
  surface: string;
  mounted: boolean;
  mountNote?: string;
  rect: { x: number; y: number; w: number; h: number } | null;
  injection: { mode: string; base: number; total: number } | null;
  results: Array<Pick<V2ProbeResult, 'assertion' | 'pass'> & { evidence?: Record<string, unknown>; violations?: unknown[] }>;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

async function rectOf(locator: Locator) {
  const el = locator.first();
  if ((await el.count()) === 0) return null;
  const box = await el.boundingBox();
  return box ? { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) } : null;
}

/** Clone rendered items inside a scroll layer up to `target` (max-content). */
async function injectClones(page: Page, scrollSel: string, itemSel: string, target: number) {
  return page
    .locator(scrollSel)
    .first()
    .evaluate(
      (el, { target, itemSel, strings }) => {
        const items = Array.from(el.querySelectorAll<HTMLElement>(itemSel));
        const base = items.length;
        if (!base) return { mode: 'clone-items', base: 0, total: 0 };
        let total = base;
        const clones: HTMLElement[] = [];
        while (total < target) {
          const clone = items[(total - base) % base].cloneNode(true) as HTMLElement;
          clone.setAttribute('data-v2audit-clone', String(total));
          el.appendChild(clone);
          clones.push(clone);
          total += 1;
        }
        const overwriteText = (root: HTMLElement, text: string) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const first = walker.nextNode();
          if (first) first.textContent = text;
        };
        if (clones[0]) overwriteText(clones[0], strings[0]);
        if (clones[1]) overwriteText(clones[1], strings[1]);
        return { mode: 'clone-items', base, total };
      },
      { target, itemSel, strings: ADVERSARIAL_STRINGS },
    );
}

/** Append N fixed-size blocks inside a container — generic max-content for
 *  surfaces whose item template is absent (e.g. empty memorial gallery). */
async function injectBlocks(page: Page, scrollSel: string, count: number, w = 220, h = 60) {
  return page
    .locator(scrollSel)
    .first()
    .evaluate(
      (el, { count, w, h }) => {
        const base = el.children.length;
        for (let i = 0; i < count; i += 1) {
          const b = document.createElement('div');
          b.setAttribute('data-v2audit-block', String(i));
          b.textContent = 'max-content block ' + i;
          b.style.cssText = `flex:0 0 auto;min-width:${w}px;width:${w}px;min-height:${h}px;height:${h}px;`;
          el.appendChild(b);
        }
        return { mode: 'block-injection', base, total: base + count };
      },
      { count, w, h },
    );
}

/** Horizontal variant of the scroll-engagement facts (memorial, cassetto bag). */
async function assertScrollEngagementX(locator: Locator): Promise<V2ProbeResult> {
  const evidence = await locator.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    const originalScrollLeft = el.scrollLeft;
    const slack = el.scrollWidth - el.clientWidth;
    const target = slack > 0 ? Math.max(1, Math.floor(slack / 2)) : 0;
    el.scrollLeft = target;
    const readBack = el.scrollLeft;
    el.scrollLeft = originalScrollLeft;
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowX: cs.overflowX,
      scrollLeftTarget: target,
      scrollLeftReadBack: readBack,
    };
  });
  const violations: V2ProbeResult['violations'] = [];
  if (!(evidence.scrollWidth > evidence.clientWidth)) {
    violations.push({ node: 'container', expected: 'scrollWidth > clientWidth under max-content', actual: `${evidence.scrollWidth} ≤ ${evidence.clientWidth}` });
  }
  if (!['auto', 'scroll'].includes(String(evidence.overflowX))) {
    violations.push({ node: 'container', expected: 'computed overflowX ∈ {auto, scroll}', actual: String(evidence.overflowX) });
  }
  if (!(evidence.scrollLeftTarget > 0 && evidence.scrollLeftReadBack > 0)) {
    violations.push({ node: 'container', expected: 'scrollLeft settable and reads back > 0', actual: `target=${evidence.scrollLeftTarget} readBack=${evidence.scrollLeftReadBack}` });
  }
  return { assertion: 'scroll-engagement', pass: violations.length === 0, evidence, violations };
}

async function measureSurface(
  page: Page,
  record: SurfaceProbeRecord,
  opts: {
    panelSel: string;
    scrollSel?: string;
    itemSel?: string;
    axis?: 'x' | 'y';
    inject?: { kind: 'clones'; count: number } | { kind: 'blocks'; count: number };
  },
) {
  const panel = page.locator(opts.panelSel).first();
  if ((await panel.count()) === 0 || !(await panel.isVisible().catch(() => false))) {
    record.mounted = false;
    return;
  }
  record.mounted = true;
  record.rect = await rectOf(panel);
  const results: V2ProbeResult[] = [];

  // Text floor — always.
  results.push(await assertTextFloor(panel, TEXT_FLOOR_PX));

  const scroll = opts.scrollSel ? page.locator(opts.scrollSel).first() : null;
  const scrollVisible = scroll && (await scroll.count()) > 0 && (await scroll.isVisible().catch(() => false));

  if (scroll) {
    const baseline: ContainerDimsBaseline | null = scrollVisible
      ? await scroll.evaluate((el) => ({ clientWidth: el.clientWidth, clientHeight: el.clientHeight }))
      : null;

    if (opts.inject && scrollVisible) {
      record.injection =
        opts.inject.kind === 'clones' && opts.itemSel
          ? await injectClones(page, opts.scrollSel!, opts.itemSel, opts.inject.count)
          : await injectBlocks(page, opts.scrollSel!, opts.inject.count);
      await page.waitForTimeout(150);
    }

    if (scrollVisible) {
      if (opts.axis === 'x') {
        results.push(await assertScrollEngagementX(scroll));
      } else {
        results.push(await assertScrollEngagement(scroll));
      }
      results.push(await assertNoHorizontalOverflow(scroll));
      if (opts.itemSel && opts.axis !== 'x') {
        results.push(await assertLastItemReachable(scroll, opts.itemSel));
        await scroll.evaluate((el) => { el.scrollTop = 0; el.scrollLeft = 0; });
      }
      results.push(await assertContainerDimsStable(scroll, baseline ?? undefined));
    } else {
      record.mountNote = (record.mountNote ?? '') + ' [scroll layer not visible]';
    }
  }
  record.results = results.map((r) => ({ assertion: r.assertion, pass: r.pass, evidence: r.evidence, violations: r.violations }));
}

/* ------------------------------------------------------------------ */
/* mount choreography                                                  */
/* ------------------------------------------------------------------ */

async function pressPanelKey(page: Page, key: string, sel: string, wantVisible: boolean) {
  const loc = page.locator(sel).first();
  /* These keys TOGGLE. A surface leaked open from a previous viewport (probe
   * error before the close Escape) makes a blind press close it again —
   * converge on the wanted state instead: press only when not already there,
   * and retry once if the toggle landed wrong. */
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const visible = await loc.isVisible().catch(() => false);
    if (visible === wantVisible) return true;
    await page.keyboard.press(key);
    try {
      if (wantVisible) await expect(loc).toBeVisible({ timeout: 8_000 });
      else await expect(loc).toBeHidden({ timeout: 4_000 });
      return true;
    } catch { /* retry the toggle once */ }
  }
  return (await loc.isVisible().catch(() => false)) === wantVisible;
}

async function openDirector(page: Page): Promise<boolean> {
  const panel = page.locator('[data-testid="director-panel"]');
  if (await panel.isVisible().catch(() => false)) return true;
  await page.keyboard.press('d');
  try {
    await expect(panel).toBeVisible({ timeout: 6_000 });
    return true;
  } catch {
    return false;
  }
}

async function directorAction(page: Page, actionId: string): Promise<boolean> {
  if (!(await openDirector(page))) return false;
  const btn = page.locator(`[data-action-id="${actionId}"]`).first();
  if ((await btn.count()) === 0) return false;
  await btn.click({ timeout: 5_000 }).catch(() => undefined);
  // Close the director panel so it never occludes the staged surface.
  await page.keyboard.press('d');
  await page.waitForTimeout(120);
  return true;
}

/** Click that tolerates an overlay intercepting the hit test — the probe
 *  measures the PANEL, not the trigger's pointer contract. */
async function forceClick(page: Page, sel: string): Promise<boolean> {
  const el = page.locator(sel).first();
  if ((await el.count()) === 0) return false;
  await el.click({ force: true, timeout: 4_000 }).catch(() => undefined);
  return true;
}

/** Ensure the panels menu is open (the trigger TOGGLES — a naive second
 *  click can close an already-open menu). Up to two attempts. */
async function openMenu(page: Page): Promise<boolean> {
  const menu = page.locator('[data-hudreal-menu]').first();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (await menu.isVisible().catch(() => false)) return true;
    await forceClick(page, '[data-testid="hud-menu-trigger"]');
    try { await expect(menu).toBeVisible({ timeout: 3_000 }); return true; } catch { /* retry */ }
  }
  return menu.isVisible().catch(() => false);
}

/** Boot once, then resize through the matrix. */
async function bootGame(page: Page) {
  await page.goto('/');
  /* `networkidle` is flaky on a live vite dev server (HMR socket keeps the
   * connection warm) — the game-mappa2 wait below is the real readiness gate. */
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await expect(page.locator('[data-testid="game-mappa2"]')).toBeVisible({ timeout: 45_000 });
  // Give the HUD chrome a beat (placement solver + warm pass).
  await page.waitForTimeout(1_500);
}

/* ------------------------------------------------------------------ */
/* the sweep                                                           */
/* ------------------------------------------------------------------ */

test.setTimeout(Number(process.env.HUD_AUDIT_TIMEOUT_MS ?? 900_000));

test('HUD surface scalability sweep — all reachable /game surfaces × 4 widths', async ({ page }, testInfo) => {
  await bootGame(page);
  let matrix: Record<string, Record<string, SurfaceProbeRecord>> = {};
  if (MERGE_EXISTING) {
    try {
      const prev = JSON.parse(readFileSync(RESULTS_FILE, 'utf8')) as { surfaces: typeof matrix };
      matrix = prev.surfaces ?? {};
    } catch { /* fresh matrix */ }
  }
  const unreachable: Array<{ surface: string; reason: string }> = [];
  type MaybePrev = SurfaceProbeRecord & { _prevMounted?: SurfaceProbeRecord };
  const rec = (surface: string, width: number): SurfaceProbeRecord => {
    matrix[surface] ??= {};
    const prev = matrix[surface][width] as MaybePrev | undefined;
    /* Each attempt writes a FRESH record — but a flake must not destroy a
     * previously MEASURED cell: keep the old mounted record in _prevMounted
     * and restore it at persist time if this attempt fails to mount. */
    const attempt: MaybePrev = { surface, mounted: false, rect: null, injection: null, results: [] };
    if (prev?.mounted) attempt._prevMounted = prev;
    matrix[surface][width] = attempt;
    return attempt;
  };
  const persist = () => {
    for (const surfaceRows of Object.values(matrix)) {
      for (const [w, r] of Object.entries(surfaceRows)) {
        const prev = (r as MaybePrev)._prevMounted;
        if (prev && !r.mounted) surfaceRows[w] = prev;
        else delete (r as MaybePrev)._prevMounted;
      }
    }
    const payload = {
      timestamp: new Date().toISOString(),
      viewportMatrix: VIEWPORTS,
      textFloorPx: TEXT_FLOOR_PX,
      baseURL: 'http://localhost:' + (process.env.HUD_AUDIT_PORT ?? '5173'),
      surfaces: matrix,
      unreachable,
    };
    mkdirSync(RESULTS_DIR, { recursive: true });
    writeFileSync(RESULTS_FILE, JSON.stringify(payload, null, 2));
  };

  /* Director staging first: reveal POIs (cassetto path). */
  const poiRevealed = await directorAction(page, 'quest');
  /* The marker entrance re-renders ~50 seal attrs per POI (the documented
   * map-quest-poi mutation storm) — let it settle before probing or
   * evaluate() calls time out against a saturated main thread. */
  await page.waitForTimeout(4_000);
  /* The demo run only needs launching once — it persists in hook state.
   * Ensure it EARLY: demoLaunch takes several render passes + a real send. */
  let runEnsured = false;
  const ensureRun = async () => {
    if (runEnsured) return;
    await directorAction(page, 'questRun');
    // Poll the belt plaque for the "expedition under way" state (send landed).
    const underway = page.getByRole('button', { name: /under way/i }).first();
    for (let i = 0; i < 12; i += 1) {
      if (await underway.isVisible().catch(() => false)) break;
      await page.waitForTimeout(2_000);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    runEnsured = true;
  };
  /* NOTE: do NOT eagerly ensureRun — the cassetto fallback relies on
   * questRun's demoLaunch opening the detail when NO run exists yet. */

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(350); // resize listener + layout settle

    /* ---- top chrome (always mounted) ---- */
    if (want('topChrome')) try {
      const r = rec('topChrome (nav/time/resources bars)', vp.w);
      const chrome = page.locator('[data-testid="game-top-chrome"]');
      if (await chrome.count()) {
        r.mounted = true;
        r.rect = await rectOf(chrome);
        const bars = {
          time: await rectOf(page.locator('[data-hudreal-time]')),
          resources: await rectOf(page.locator('[data-hudreal-resources]')),
          nav: await rectOf(page.locator('[data-hudreal-nav]')),
        };
        const floorResult = await assertTextFloor(chrome, TEXT_FLOOR_PX);
        const navFloor = await assertTextFloor(page.locator('[data-hudreal-nav]'), TEXT_FLOOR_PX);
        r.results = [
          { assertion: floorResult.assertion, pass: floorResult.pass, evidence: floorResult.evidence, violations: floorResult.violations },
          { assertion: `text-floor:nav` as never, pass: navFloor.pass, evidence: navFloor.evidence, violations: navFloor.violations },
        ];
        (r as unknown as { bars: unknown }).bars = bars;
      }
    } catch (e) { rec('topChrome (nav/time/resources bars)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- menu (HudRealMenuPanel) ---- */
    if (want('menuPanel')) try {
      const r = rec('menuPanel', vp.w);
      if (await openMenu(page)) {
        await measureSurface(page, r, { panelSel: '[data-hudreal-menu]' });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
      } else {
        r.mounted = false; r.mountNote = 'menu did not open on trigger click';
      }
    } catch (e) { rec('menuPanel', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- roster (production, manifest frame) ---- */
    if (want('roster')) try {
      const r = rec('roster (DragTestContainerV2)', vp.w);
      if (await pressPanelKey(page, 'r', '[data-testid="resident-roster-panel"]', true)) {
        await measureSurface(page, r, {
          panelSel: '[data-testid="resident-roster-panel"]',
          scrollSel: '[data-testid="resident-roster-panel"] [data-resident-count]',
          itemSel: '[data-resident-id]',
          inject: { kind: 'clones', count: 60 },
        });
        await page.keyboard.press('r');
        await page.waitForTimeout(150);
      } else {
        r.mounted = false; r.mountNote = "'r' did not open roster";
      }
    } catch (e) { rec('roster (DragTestContainerV2)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- ledger (baked HudRealPanel) ---- */
    if (want('ledger')) try {
      const r = rec('ledger (HudRealPanel)', vp.w);
      if (await pressPanelKey(page, 'e', '[data-hudreal-panel]', true)) {
        await measureSurface(page, r, {
          panelSel: '[data-hudreal-panel]',
          scrollSel: '[data-hudreal-panel] ul',
          itemSel: 'li',
          inject: { kind: 'clones', count: 40 },
        });
        await page.keyboard.press('e');
        await page.waitForTimeout(150);
      } else {
        r.mounted = false; r.mountNote = "'e' did not open ledger";
      }
    } catch (e) { rec('ledger (HudRealPanel)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- stash (manifest frame, N=3 committed) ---- */
    if (want('stash')) try {
      const r = rec('stash (VillageStashPanel)', vp.w);
      if (await pressPanelKey(page, 'v', '[data-testid="stash-shelf"]', true)) {
        await measureSurface(page, r, {
          panelSel: '[data-testid="stash-shelf"] >> xpath=ancestor::*[@data-hud-panel][1]',
          scrollSel: '[data-testid="stash-shelf"]',
          itemSel: '[data-testid^="stash-item-"]',
          inject: { kind: 'clones', count: 60 },
        });
        await page.keyboard.press('v');
        await page.waitForTimeout(150);
      } else {
        r.mounted = false; r.mountNote = "'v' did not open stash";
      }
    } catch (e) { rec('stash (VillageStashPanel)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- merchant (baked HudRealPanel) ---- */
    if (want('merchant')) try {
      const r = rec('merchant (HudRealPanel)', vp.w);
      if (await pressPanelKey(page, 'm', '[data-hudreal-panel]', true)) {
        await measureSurface(page, r, {
          panelSel: '[data-hudreal-panel]',
          scrollSel: '[data-hudreal-panel] ul',
          itemSel: 'li',
          inject: { kind: 'clones', count: 40 },
        });
        await page.keyboard.press('m');
        await page.waitForTimeout(150);
      } else {
        r.mounted = false; r.mountNote = "'m' did not open merchant";
      }
    } catch (e) { rec('merchant (HudRealPanel)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- cassetto (POI click → expedition drawer column) ---- */
    if (want('cassetto')) try {
      const r = rec('cassetto (ExpeditionDrawer column)', vp.w);
      const drawer = page.locator('[data-hudreal-cassetto]').first();
      let viaDemoLaunch = false;
      if (!(await drawer.isVisible().catch(() => false))) {
        if (poiRevealed) {
          // The hit target is the WRAPPER ([data-map-quest-poi-target], the
          // role=button with onClick) — the data-testid glyph inside may be
          // pointer-events:none and/or panned offscreen at some widths.
          const pois = page.locator('[data-map-quest-poi-target]');
          const n = await pois.count();
          for (let i = 0; i < Math.min(n, 4) && !(await drawer.isVisible().catch(() => false)); i += 1) {
            await pois.nth(i).click({ force: true, timeout: 3_000 }).catch(() => undefined);
            try { await expect(drawer).toBeVisible({ timeout: 4_000 }); } catch { /* next marker */ }
          }
          if (!(await drawer.isVisible().catch(() => false))) {
            // Fallback: the questRun action also opens the detail when no run
            // exists yet (demoLaunch → setIsDetailOpen); with a live run it
            // opens the run window instead — the detail stays closed then.
            await directorAction(page, 'questRun');
            viaDemoLaunch = true;
            try { await expect(drawer).toBeVisible({ timeout: 6_000 }); } catch { /* recorded below */ }
          }
        } else {
          r.mountNote = 'director "quest" action failed — POIs not revealed';
        }
      }
      if (await drawer.isVisible().catch(() => false)) {
        await measureSurface(page, r, {
          panelSel: '[data-hudreal-cassetto]',
          // The SUPPLIES bag row is the cassetto's horizontal scroll layer.
          scrollSel: '[data-cassetto-bag-scroll]',
          itemSel: '[data-testid^="bag-slot-"]',
          axis: 'x',
          inject: { kind: 'clones', count: 30 },
        });
        /* demoLaunch's auto-assign/send chain is gated on `isDetailOpen`:
         * closing now would abort the run the expeditionLost probe needs.
         * Leave it open when lost is in this run's scope; ensureRun reuses it. */
        const keepOpenForRun = viaDemoLaunch && want('expeditionLost');
        if (!keepOpenForRun) {
          if (!(await page.locator('[data-testid="cassetto-close"]').first().click({ timeout: 3_000 }).then(() => true).catch(() => false))) {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(200);
        }
      } else {
        r.mounted = false;
        r.mountNote = (r.mountNote ?? '') + ' cassetto column not mounted';
      }
    } catch (e) { rec('cassetto (ExpeditionDrawer column)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- memorial (menu → Memoriale) ---- */
    if (want('memorial')) try {
      const r = rec('memorial (HudRealMemorial)', vp.w);
      if (await openMenu(page)) {
        const item = page.getByRole('menuitem', { name: /memorial/i }).first();
        try { await expect(item).toBeVisible({ timeout: 3_000 }); } catch { /* miss below */ }
        if (await item.isVisible().catch(() => false)) {
          await item.click({ timeout: 4_000 }).catch(() => undefined);
          const mem = page.locator('[data-testid="hudreal-memorial"]').first();
          try {
            await expect(mem).toBeVisible({ timeout: 5_000 });
            await measureSurface(page, r, {
              panelSel: '[data-testid="hudreal-memorial"]',
              // The gallery bay strip: last div child of the memorial root.
              scrollSel: '[data-testid="hudreal-memorial"] > div:last-of-type',
              axis: 'x',
              inject: { kind: 'blocks', count: 8 },
            });
          } catch {
            r.mounted = false; r.mountNote = 'memorial did not mount after menuitem click';
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(150);
        } else {
          r.mounted = false; r.mountNote = 'no Memoriale menuitem';
          await page.keyboard.press('Escape');
        }
      } else {
        r.mounted = false; r.mountNote = 'menu trigger not found';
      }
    } catch (e) { rec('memorial (HudRealMemorial)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- levelup (director staging) ---- */
    if (want('levelUp')) try {
      const r = rec('levelUp (HudRealLevelUp)', vp.w);
      const layer = page.locator('[data-testid="hudreal-levelup-layer"]');
      /* "zero eligible targets" is state-dependent — retry the action. */
      for (let i = 0; i < 3 && !(await layer.isVisible().catch(() => false)); i += 1) {
        if (await directorAction(page, 'levelup')) {
          try { await expect(layer).toBeVisible({ timeout: 5_000 }); break; } catch { /* retry */ }
        }
      }
      if (await layer.isVisible().catch(() => false)) {
        try {
          await measureSurface(page, r, {
            panelSel: '[data-testid="hudreal-levelup-layer"]',
            // The baroque-shield gains zone: `overflow:hidden` — clip vs scroll.
            scrollSel: '[data-testid="hudreal-levelup-plate"] div:has(> [data-gain-row])',
            itemSel: '[data-gain-row]',
            inject: { kind: 'clones', count: 18 },
          });
          (r as unknown as { plateRect: unknown }).plateRect = await rectOf(page.locator('[data-testid="hudreal-levelup-plate"]'));
        } catch {
          r.mounted = false; r.mountNote = 'probe failed on mounted plate';
        }
        // Dismiss remaining plates (Escape per plate, MAX_PLATES=4).
        for (let i = 0; i < 5; i += 1) { await page.keyboard.press('Escape'); await page.waitForTimeout(80); }
      } else {
        r.mounted = false; r.mountNote = 'levelUp staging mounted no plate after 3 attempts';
      }
    } catch (e) { rec('levelUp (HudRealLevelUp)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- reliquary (director 'legacy' toggle) ---- */
    if (want('reliquary')) try {
      const r = rec('reliquary (HudRealReliquary)', vp.w);
      const rel = page.locator('[data-testid="hudreal-reliquary"]');
      for (let i = 0; i < 3 && !(await rel.isVisible().catch(() => false)); i += 1) {
        if (await directorAction(page, 'legacy')) {
          try { await expect(rel).toBeVisible({ timeout: 4_000 }); break; } catch { /* retry */ }
        }
      }
      if (await rel.isVisible().catch(() => false)) {
        try {
          await measureSurface(page, r, {
            panelSel: '[data-testid="hudreal-reliquary"]',
            scrollSel: '[data-testid^="hudreal-reliquary-col-"]',
            itemSel: '[data-testid^="hudreal-reliquary-slot-"]',
            inject: { kind: 'clones', count: 12 },
          });
        } catch {
          r.mounted = false; r.mountNote = 'probe failed on mounted reliquary';
        }
        await directorAction(page, 'legacy'); // toggle off
        await page.waitForTimeout(120);
      } else {
        r.mounted = false; r.mountNote = 'legacy action did not mount reliquary after 3 attempts';
      }
    } catch (e) { rec('reliquary (HudRealReliquary)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    /* ---- expedition lost (needs a live run) ---- */
    if (want('expeditionLost')) try {
      const r = rec('expeditionLost (HudRealExpeditionLost)', vp.w);
      const lostLayer = page.locator('[data-testid="hudreal-lost-layer"]');
      if (!(await lostLayer.isVisible().catch(() => false))) {
        await ensureRun();
        // Retry the staging action — the run lands asynchronously after send.
        for (let i = 0; i < 4 && !(await lostLayer.isVisible().catch(() => false)); i += 1) {
          if (await directorAction(page, 'expeditionLost')) {
            try { await expect(lostLayer).toBeVisible({ timeout: 4_000 }); break; } catch { /* retry */ }
          }
          await page.waitForTimeout(2_000);
        }
      }
      if (await lostLayer.isVisible().catch(() => false)) {
        await measureSurface(page, r, {
          panelSel: '[data-testid="hudreal-lost-layer"]',
          scrollSel: '[data-testid="hudreal-lost-tombs"]',
          itemSel: '[data-testid="hudreal-lost-tomb"]',
          inject: { kind: 'clones', count: 14 },
        });
        // Real close path: the on-plaque close button.
        const closeBtn = lostLayer.locator('button').last();
        await closeBtn.click({ timeout: 3_000 }).catch(() => page.keyboard.press('Escape'));
        await page.waitForTimeout(150);
      } else {
        r.mounted = false;
        r.mountNote = 'expeditionLost staging did not mount — needs activeQuestRun.run (demo launch may have failed)';
      }
    } catch (e) { rec('expeditionLost (HudRealExpeditionLost)', vp.w).mountNote = `probe error: ${String(e).slice(0, 160)}`; }

    persist();
  }

  /* ---- victory — documented unreachable ---- */
  const victoryVisible = await page.locator('[data-testid="hudreal-victory-reward"]').isVisible().catch(() => false);
  if (!victoryVisible) {
    unreachable.push({
      surface: 'HudRealVictoryReward',
      reason:
        'Mounts only on `activeQuestRun.run.ended` — requires a REAL quest run completing (goblin quest ≈5 in-game days of 1s ticks; no staging hook exists: stageExpeditionLost clones the run for the lost path only, and questRunStore writes do not reach `useQuestRun` state). Not triggerable cheaply; audit covers it statically only.',
    });
  }
  unreachable.push({
    surface: 'HudRealVoce',
    reason: 'Toast mounts only on a live `voceMessage` feed event (quest beats); no staging hook on /game.',
  });
  unreachable.push({
    surface: 'HudRealSeal / HudRealCompass / HudRealGlobe / HudRealBrand / HudRealBust / HudRealCrest / HudRealAstrolabe / HudRealTriad / HudRealRoster* variants / ExpeditionBottomSheet',
    reason: 'Unmounted on /game during the audit — lab surfaces or form-factor alternates; static census only.',
  });

  persist();

  console.log('[HUD-AUDIT] verdicts:');
  for (const [surface, perWidth] of Object.entries(matrix)) {
    for (const [w, r] of Object.entries(perWidth)) {
      const line = r.mounted
        ? r.results.map((x) => `${x.pass ? 'P' : 'F'}:${x.assertion}`).join(' ')
        : `UNMOUNTED ${r.mountNote ?? ''}`;
      console.log(`[HUD-AUDIT] ${surface} @${w}: ${line}`);
    }
  }
  console.log(`[HUD-AUDIT] results written to ${RESULTS_FILE}`);

  // Harness sanity — the sweep must have mounted the core surfaces.
  expect(matrix['roster (DragTestContainerV2)']?.['1280']?.mounted, 'roster mounted at 1280').toBe(true);
});
