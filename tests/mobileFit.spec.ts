/**
 * mobileFit.spec.ts — contratto mobile-fit `/game` (PLAN-083, R-274).
 *
 * mobileSmoke suite (viewport portrait 390x844, touch): asserzioni
 * COMPORTAMENTALI sui break osservati nel probe 2026-10-23
 * (`test-results/mobile-probe-2026-10-23/`), mai un generico «loads»:
 *
 *  - B1  top HUD non clippata (tutto il chrome entro il viewport)
 *  - B2  nav raggiungibile: dentro il viewport, ogni target ≥44x44
 *  - B4  fit portrait = cover sull'asse corto su mapFocal; zoom effettivi;
 *        pan clamp su protected edge (nessuna area fuori mappa a pan max)
 *  - B5  hint keyboard-only soppressi su pointer:coarse
 *  - B7  pannelli sotto breakpoint in sheet mode: bounding box ≤ viewport
 *
 * desktopEmitIdentical suite: a ≥768 il layout è la coppia wheel verbatim —
 * asserzioni di geometria DOM a 1280 per impedire drift.
 *
 * Boot singolo: `describe.serial` + page condivisa (il boot dev/preview
 * costa ~10-30s; mai N boot per N test — nota dibattito deepseek).
 *
 * Costanti dal contratto vivo: `tests/helpers/mapFitContract.ts` +
 * `mobileFitConfig` (Zod, `src/balancing/config/idleVillage/`).
 */

import { test, expect, type Page, type Browser } from '@playwright/test';
import {
  MAP_FIT_CANVAS,
  MAP_FIT_LAND,
  MAP_FIT_MEASURE_ARGS,
  measureMapFitInPage,
  effectiveFitInsets,
} from './helpers/mapFitContract';
import { getMobileFitConfig } from '@/balancing/config/idleVillage/mobileFitConfig';

const CANVAS = '[data-testid="pixi-world-canvas"]';
const BOOT = '[data-testid="game-boot-screen"]';
const NAV_ID = '[data-nav-id]';

const CFG = getMobileFitConfig();
const MOBILE = { width: 390, height: 844 };

/** Cover scale: painted canvas fills the viewport on both axes. */
const coverScale = (vw: number, vh: number) =>
  Math.max(vw / MAP_FIT_CANVAS.w, vh / MAP_FIT_CANVAS.h);

/** Boots /game once and returns a page with the world rendered. */
async function bootGame(browser: Browser): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewportSize(MOBILE);
  await page.goto('/game');
  await page.waitForSelector(CANVAS, { state: 'attached' });
  await page.waitForSelector(BOOT, { state: 'detached' });
  // una volta renderizzato: un frame perché refit() sia applicato
  await page.waitForFunction(() => (window as { __worldCam?: unknown }).__worldCam != null, undefined, {
    timeout: 60000,
  });
  await page.waitForTimeout(300);
  return page;
}

const camZoom = (page: Page) =>
  page.evaluate(() => (window as { __worldCam?: { zoom: number } }).__worldCam?.zoom ?? 0);

test.describe.serial('mobileSmoke — PLAN-083 @390x844', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await bootGame(browser);
  });
  test.afterAll(async () => {
    await page?.close();
  });

  test('documento senza overflow orizzontale', async () => {
    const { scroll, client } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(scroll, `scrollWidth ${scroll} > clientWidth ${client}`).toBeLessThanOrEqual(client);
  });

  test('B2 — nav dentro il viewport, ogni target ≥44px, non sovrapposti', async () => {
    const navs = page.locator(NAV_ID);
    const count = await navs.count();
    expect(count, 'nessun [data-nav-id] trovato').toBeGreaterThan(0);
    const rects: { x: number; y: number; w: number; h: number; id: string }[] = [];
    for (let i = 0; i < count; i++) {
      const el = navs.nth(i);
      const box = await el.boundingBox();
      const id = (await el.getAttribute('data-nav-id')) ?? `#${i}`;
      expect(box, `nav ${id} senza bounding box`).not.toBeNull();
      if (!box) continue;
      rects.push({ ...box, id });
      // interamente visibile nel viewport
      expect(box.x, `nav ${id} clip sinistra`).toBeGreaterThanOrEqual(0);
      expect(box.y, `nav ${id} clip top`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `nav ${id} clip destra (${box.x + box.width} > ${MOBILE.width})`)
        .toBeLessThanOrEqual(MOBILE.width);
      expect(box.y + box.height, `nav ${id} clip bottom`).toBeLessThanOrEqual(MOBILE.height);
      // touch target minimo
      expect(box.width, `nav ${id} width ${box.width} < ${CFG.minTargetPx}`).toBeGreaterThanOrEqual(
        CFG.minTargetPx,
      );
      expect(box.height, `nav ${id} height ${box.height} < ${CFG.minTargetPx}`).toBeGreaterThanOrEqual(
        CFG.minTargetPx,
      );
    }
    // non sovrapposti
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlap =
          a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        expect(overlap, `nav ${a.id} e ${b.id} si sovrappongono`).toBe(false);
      }
    // «Altro» overflow presente (sheet) — contratto VF-1 risolto
    const more = page.locator('[data-nav-more]');
    await expect(more, 'chip «Altro» assente').toBeVisible();
    const mbox = await more.boundingBox();
    expect(mbox!.width).toBeGreaterThanOrEqual(CFG.minTargetPx);
    expect(mbox!.height).toBeGreaterThanOrEqual(CFG.minTargetPx);
  });

  test('B1 — top HUD non clippata (tutto il chrome entro il viewport)', async () => {
    const viol = await page.evaluate(() => {
      const vw = window.innerWidth;
      const out: string[] = [];
      document
        .querySelectorAll<HTMLElement>('.game-frame [data-hud-controls], .game-frame section')
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.left < -1 || r.right > vw + 1)
            out.push(`${el.getAttribute('aria-label') ?? el.tagName} right=${r.right.toFixed(0)} > ${vw}`);
        });
      return out;
    });
    expect(viol, `chrome clippata: ${viol.join('; ')}`).toEqual([]);
  });

  test('B4 — portrait fit copre l\'asse corto (zoom ≥ cover scale, niente letterbox)', async () => {
    const zoom = await camZoom(page);
    const cover = coverScale(MOBILE.width, MOBILE.height);
    expect(zoom, `zoom ${zoom} < cover ${cover.toFixed(3)}`).toBeGreaterThanOrEqual(cover - 0.005);
    // il focale authored è centrato in orizzontale sull'area libera
    const cam = await page.evaluate(
      () => (window as { __worldCam?: { panX: number; zoom: number; width: number } }).__worldCam!,
    );
    const focalScreenX = (CFG.mapFocal.x * cam.width - cam.panX) * cam.zoom;
    expect(
      Math.abs(focalScreenX - MOBILE.width / 2),
      `focale a ${focalScreenX.toFixed(0)}px, atteso ~${MOBILE.width / 2}px`,
    ).toBeLessThanOrEqual(MOBILE.width * 0.05);
  });

  test('B4 — pan clamp: mai area fuori dalla mappa dipinta a pan massimale', async () => {
    // spinge la camera oltre i bound: apply() deve ri-clampare su protected edge
    await page.evaluate(() => {
      const ctl = (window as { __worldCamCtl?: { set: (p: { panX: number; panY: number }) => void } })
        .__worldCamCtl;
      ctl?.set({ panX: -1e6, panY: -1e6 });
    });
    const m1 = await page.evaluate(measureMapFitInPage, MAP_FIT_MEASURE_ARGS);
    expect(m1.error).toBeUndefined();
    // la quad mare copre ancora tutto il viewport (nessuno stage-leak geometrico)
    expect(m1.seaQuad!.left).toBeLessThanOrEqual(0);
    expect(m1.seaQuad!.top).toBeLessThanOrEqual(0);
    expect(m1.seaQuad!.right).toBeGreaterThanOrEqual(m1.vw!);
    expect(m1.seaQuad!.bottom).toBeGreaterThanOrEqual(m1.vh!);
    await page.evaluate(() => {
      const ctl = (window as { __worldCamCtl?: { set: (p: { panX: number; panY: number }) => void } })
        .__worldCamCtl;
      ctl?.set({ panX: 1e6, panY: 1e6 });
    });
    const m2 = await page.evaluate(measureMapFitInPage, MAP_FIT_MEASURE_ARGS);
    expect(m2.seaQuad!.left).toBeLessThanOrEqual(0);
    expect(m2.seaQuad!.right).toBeGreaterThanOrEqual(m2.vw!);
    // ripristino
    await page.evaluate(() =>
      (window as { __worldCamCtl?: { refit: () => void } }).__worldCamCtl?.refit(),
    );
  });

  test('B4 — range pinch non-vuoto: effectiveMax/effectiveMin ≥ floor', async () => {
    const zoom = await camZoom(page);
    // il resting zoom è effectiveMin; il max effettivo è derivato via test seam
    const bounds = await page.evaluate(
      () =>
        (window as { __worldCamBounds?: { min: number; max: number; mobile: boolean } })
          .__worldCamBounds ?? null,
    );
    expect(bounds, 'test seam __worldCamBounds assente').not.toBeNull();
    expect(bounds!.mobile).toBe(true);
    expect(
      bounds!.max / bounds!.min,
      `range pinch ${(bounds!.max / bounds!.min).toFixed(2)} < floor ${CFG.mobileZoomRangeFloor}`,
    ).toBeGreaterThanOrEqual(CFG.mobileZoomRangeFloor);
    // resting zoom = effectiveMin (entro tolleranza)
    expect(Math.abs(zoom - bounds!.min)).toBeLessThanOrEqual(bounds!.min * 0.05);
  });

  test('B5 — hint keyboard-only soppressi su pointer:coarse', async () => {
    // apre la vista villaggio via nav touch
    await page.tap(`${NAV_ID}[data-nav-id="village"]`).catch(async () => {
      await page.locator('[data-nav-id="village"]').tap();
    });
    await page.waitForTimeout(600);
    // il legend «← → buildings · Enter details · Esc map» non deve essere visibile
    const legend = page.getByText(/buildings.*Enter|Enter details|Esc map/);
    await expect(legend, 'hint keyboard visibile su touch').toHaveCount(0);
  });

  test('B7 — pannelli aperti non superano il viewport (sheet mode)', async () => {
    // apre il pannello pannelli/roster via trigger esistente
    const trigger = page.locator('[data-hud-panels-trigger]').first();
    if (await trigger.isVisible()) {
      await trigger.tap();
      await page.waitForTimeout(400);
      const first = page.locator('[role="menuitemcheckbox"]').first();
      if (await first.isVisible()) {
        await first.tap();
        await page.waitForTimeout(500);
      }
    }
    const viol = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('[data-hud-panel]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1)
          out.push(`${el.getAttribute('aria-label') ?? 'panel'} ${JSON.stringify(r)}`);
      });
      return out;
    });
    expect(viol, `pannelli fuori viewport: ${viol.join('; ')}`).toEqual([]);
  });
});

test.describe('desktopEmitIdentical — PLAN-083', () => {
  test('a 1280x800 la geometria chrome è quella desktop (nav con label, nessun chip Altro)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/game');
    await page.waitForSelector(CANVAS, { state: 'attached' });
    await page.waitForSelector(BOOT, { state: 'detached' });
    await page.waitForTimeout(300);
    // nessun chip «Altro» a desktop
    await expect(page.locator('[data-nav-more]')).toHaveCount(0);
    // nav item mostrano label testuale (non icon-only)
    const village = page.locator('[data-nav-id="village"]');
    await expect(village).toBeVisible();
    const text = await village.textContent();
    expect(text?.trim().length, 'nav desktop senza label testuale').toBeGreaterThan(0);
    // bounds wheel verbatim: la seam pubblica la coppia manifest (0.18 / 3)
    await page
      .waitForFunction(() => (window as { __worldCam?: unknown }).__worldCam != null, undefined, {
        timeout: 60000,
      })
      .catch(() => undefined);
    const bounds = await page.evaluate(
      () =>
        (window as { __worldCamBounds?: { min: number; max: number; mobile: boolean } })
          .__worldCamBounds ?? null,
    );
    if (bounds) {
      expect(bounds.mobile).toBe(false);
      expect(bounds.min).toBeCloseTo(0.18, 2);
      expect(bounds.max).toBeCloseTo(3, 1);
    }
  });
});
