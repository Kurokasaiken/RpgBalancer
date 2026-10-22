/**
 * gameGeometryT01.spec.ts — contratto geometrico /game classe T-01 (PLAN-044 T-004).
 *
 * Recurring trap T-01: l'isola può scivolare sotto il chrome HUD quando la
 * copertura del floor e il fit del contenuto confliggono (R-148 risolve con
 * sea margin ampi + minZoom — qui si asserisce il CONTRATTO, non la ricetta).
 *
 * Livello DOM-assertabile v1:
 *  - il canvas del mondo copre l'intero viewport (nessuna banda scoperta
 *    dove il contenuto possa nascondersi dietro il chrome);
 *  - ogni elemento di chrome HUD visibile è interamente dentro il viewport;
 *  - le ancore di chrome top-level (placca, hide-toggle, panels trigger,
 *    strip tab) non si sovrappongono fra loro.
 *
 * Livello contrattuale v2 (PLAN-054 T-001, CTR-game-005): la posizione
 * dell'isola DENTRO il canvas è ora osservabile via `window.__worldCam`
 * (test seam dev/playwright in `PixiWorldMap`) e verificata nei blocchi
 * tag `INV:CTR-game-005.INV-1…INV-3` qui sotto — proiezione land↔chrome fisso,
 * south-pin dopo user-zoom + resize, copertura quad mare e scanline
 * stage-leak/seam ai bound di pan. Le costanti arrivano da
 * `tests/helpers/mapFitContract.ts` (config + renderer, mai hardcoded).
 *
 * Eseguito a tre viewport: il conflitto floor-coverage vs content-fit si
 * manifesta cambiando il rapporto viewport/mappa.
 */

import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import {
  expectCoversViewport,
  expectDisjoint,
  expectInsideViewport,
  rectOf,
  type Rect,
} from '../../helpers/geometry';
import {
  evaluateMapFit,
  MAP_FIT_MARGIN_X,
  MAP_FIT_MEASURE_ARGS,
  MAP_FIT_STAGE_COLOR,
  MAP_FIT_VIEWPORTS,
  measureMapFitInPage,
  scanlineCheckPng,
  type MapFitMeasurement,
} from '../../helpers/mapFitContract';

const CANVAS = '[data-testid="pixi-world-canvas"]';
const BOOT = '[data-testid="game-boot-screen"]';

/** Ancore di chrome top-level: elementi distinti, mai annidati l'uno nell'altro. */
const CHROME_ANCHORS = [
  '[data-testid="village-plaque"]',
  '[data-testid="hud-hide-toggle"]',
  '[data-hud-panels-trigger]',
];

/** Qualunque chrome HUD, incluse le zone annidate (data-hud-controls, strip tab). */
const ALL_CHROME =
  '[data-hud-controls], [data-hud-hide-toggle], [data-hud-panels-trigger], [data-hud-strip-tab], [data-testid="village-plaque"]';

const VIEWPORTS = [
  { width: 1280, height: 720, label: 'default' },
  { width: 800, height: 600, label: 'small' },
  { width: 1920, height: 1080, label: 'large' },
];

test.describe('contratto geometrico /game — classe T-01', () => {
  for (const vp of VIEWPORTS) {
    test(`canvas copre il viewport e chrome dentro/disgiunto @${vp.label} ${vp.width}x${vp.height}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/game');
      await page.waitForSelector(CANVAS, { state: 'attached' });
      await page.waitForSelector(BOOT, { state: 'detached' });
      // un frame perché refit() sia applicato al nuovo viewport
      await page.waitForTimeout(300);

      // 1) il canvas del mondo copre l'intero viewport — nessuna banda scoperta
      const canvas = await rectOf(page.locator(CANVAS));
      expect(canvas, 'pixi-world-canvas non visibile').not.toBeNull();
      expectCoversViewport(canvas!, page, 'pixi-world-canvas');

      // 2) ogni chrome HUD visibile sta interamente dentro il viewport
      const chromeSel = page.locator(ALL_CHROME);
      const n = await chromeSel.count();
      const seen: { label: string; rect: Rect }[] = [];
      for (let i = 0; i < n; i++) {
        const loc = chromeSel.nth(i);
        const rect = await rectOf(loc);
        if (rect) {
          expectInsideViewport(rect, page, `${ALL_CHROME}[${i}]`);
          seen.push({ label: `${ALL_CHROME}[${i}]`, rect });
        }
      }
      expect(seen.length, 'nessun chrome HUD visibile — la pagina ha caricato?').toBeGreaterThan(0);

      // 3) le ancore top-level non si sovrappongono fra loro
      const anchors: { label: string; rect: Rect }[] = [];
      for (const sel of CHROME_ANCHORS) {
        const rect = await rectOf(page.locator(sel).first());
        if (rect) anchors.push({ label: sel, rect });
      }
      for (let i = 0; i < anchors.length; i++) {
        for (let j = i + 1; j < anchors.length; j++) {
          expectDisjoint(anchors[i].rect, anchors[j].rect, anchors[i].label, anchors[j].label);
        }
      }
    });
  }
});

type WorldCamWindow = Window & {
  __worldCam?: { panX: number; panY: number; zoom: number; width: number; height: number };
  __worldCamCtl?: {
    set: (partial: { panX?: number; panY?: number; zoom?: number }) => void;
    refit: () => void;
  };
};

/** Attende boot completo + primo apply() della camera (test seam dev/playwright). */
const waitForWorldCam = async (page: import('@playwright/test').Page) => {
  await page.waitForSelector(CANVAS, { state: 'attached' });
  await page.waitForSelector(BOOT, { state: 'detached' });
  await page.waitForFunction(() => (window as WorldCamWindow).__worldCam != null, undefined, { timeout: 60_000 });
  await page.waitForTimeout(400);
};

const measure = (page: import('@playwright/test').Page) =>
  page.evaluate(measureMapFitInPage, MAP_FIT_MEASURE_ARGS) as Promise<MapFitMeasurement>;

const verdictMessage = (v: ReturnType<typeof evaluateMapFit>) =>
  JSON.stringify({ precheck: v.precheck, fixed: v.fixedChromeViolations, sea: v.seaCoverageViolations, southPin: v.southPinViolation });

test.describe('CTR-game-005 — map fit & sea continuity (plan054 T-001)', () => {
  // INV:CTR-game-005.INV-1 — protected land is disjoint from the FIXED chrome
  // at rest and after a recenter refit; pre-checks are fail-closed (the run is
  // red if __worldCam is missing, uncalibrated, or the chrome anchors vanish).
  for (const vp of MAP_FIT_VIEWPORTS) {
    test(`INV-1 land↔fixed-chrome disjoint at rest/refit @${vp.label} (DPR 1)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto('/game');
      await waitForWorldCam(page);

      const atRest = evaluateMapFit(await measure(page), vp);
      expect(atRest.ok, `rest ${vp.label}: ${verdictMessage(atRest)}`).toBe(true);

      // Post-recenter: same resting contract must hold after the recenter path.
      await page.evaluate(() => (window as WorldCamWindow).__worldCamCtl?.refit());
      await page.waitForTimeout(200);
      const afterRefit = evaluateMapFit(await measure(page), vp);
      expect(afterRefit.ok, `post-refit ${vp.label}: ${verdictMessage(afterRefit)}`).toBe(true);
    });
  }

  // INV:CTR-game-005.INV-1 — ultrawide regression: browser auto HUD scale
  // magnifies the fixed chrome, so safe-fit must reserve the zoomed bands
  // instead of the unscaled layout pixels declared by the config.
  test('INV-1 land↔fixed-chrome disjoint @3440x1440 (HUD auto zoom)', async ({ page }) => {
    const vp = { w: 3440, h: 1440, label: '3440x1440' };
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('/game');
    await waitForWorldCam(page);

    const atRest = evaluateMapFit(await measure(page), vp);
    expect(atRest.ok, `rest ${vp.label}: ${verdictMessage(atRest)}`).toBe(true);

    await page.evaluate(() => (window as WorldCamWindow).__worldCamCtl?.refit());
    await page.waitForTimeout(200);
    const afterRefit = evaluateMapFit(await measure(page), vp);
    expect(afterRefit.ok, `post-refit ${vp.label}: ${verdictMessage(afterRefit)}`).toBe(true);
  });

  // INV:CTR-game-005.INV-1 — same invariant at devicePixelRatio 2 (fractional
  // screen-space coordinates: the fit maths must not leak rounding into the
  // chrome band).
  test('INV-1 land↔fixed-chrome disjoint @1440x900 (DPR 2)', async ({ browser }) => {
    const vp = { w: 1440, h: 900, label: '1440x900' };
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL as string,
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    try {
      await page.goto('/game');
      await waitForWorldCam(page);
      const verdict = evaluateMapFit(await measure(page), vp);
      expect(verdict.ok, `dpr2 ${vp.label}: ${verdictMessage(verdict)}`).toBe(true);
    } finally {
      await context.close();
    }
  });

  // INV:CTR-game-005.INV-2 — after a user wheel-zoom (userMoved) a resize must
  // still keep the south-pin and zero fixed-chrome violations; same with a
  // floating panel open (insets change → refit must protect the land).
  test('INV-2 south-pin survives user zoom + resize + floating panel', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 800 });
    await page.goto('/game');
    await waitForWorldCam(page);

    await page.mouse.move(960, 400);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 1440, height: 700 });
    await page.waitForTimeout(1200);

    const afterResize = evaluateMapFit(await measure(page), { w: 1440, h: 700 });
    expect(afterResize.ok, `after zoom+resize: ${verdictMessage(afterResize)}`).toBe(true);
    expect(afterResize.southPinViolation, 'south-pin broken after user zoom + resize').toBeNull();

    // Floating panel open → live insets change → refit must re-protect the land.
    await page.locator('[data-hud-panels-trigger]').click();
    await page.getByRole('menuitemcheckbox', { name: 'Roster' }).click();
    await expect(page.locator('[data-testid="resident-roster-panel"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(600);

    const withPanel = evaluateMapFit(await measure(page), { w: 1440, h: 700 });
    expect(withPanel.ok, `with roster panel: ${verdictMessage(withPanel)}`).toBe(true);
    expect(withPanel.southPinViolation, 'south-pin broken with floating panel open').toBeNull();
    // Floating panels MAY cover land — reported only, not a violation.
    expect(withPanel.fixedChromeViolations).toEqual([]);
  });

  // INV:CTR-game-005.INV-3 — at the sea-margin pan bounds and a fractional
  // zoom the deep-sea quads must still cover the whole viewport (geometry)
  // and the scanline must find zero stage-leak pixels and no hard seam step
  // on the projected canvas edge (R-148 "line between old and new sea").
  test('INV-3 sea quad coverage + scanline at pan bounds', async ({ page }) => {
    const vp = { w: 1440, h: 900 };
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('/game');
    await waitForWorldCam(page);

    // Jump deterministically to the left pan bound and the bottom pan bound
    // (apply() clamps to the real bound) at a fractional zoom.
    await page.evaluate(
      ([marginX]) =>
        (window as WorldCamWindow).__worldCamCtl?.set({ panX: -marginX, panY: Number.MAX_SAFE_INTEGER, zoom: 0.3733 }),
      [MAP_FIT_MARGIN_X] as const,
    );
    await page.waitForTimeout(300);
    const m = await measure(page);
    const verdict = evaluateMapFit(m, vp);
    expect(verdict.seaCoverageViolations, `sea coverage: ${verdict.seaCoverageViolations.join(', ')}`).toEqual([]);

    const shot = await page.screenshot({ scale: 'css' });
    const scan = scanlineCheckPng(PNG.sync.read(shot), m, MAP_FIT_STAGE_COLOR);
    expect(
      scan.ok,
      `scanline: ${scan.findings.map((f) => `${f.kind}: ${f.detail}`).join(' | ')} (metrics ${JSON.stringify(scan.metrics)})`,
    ).toBe(true);
  });
});
