/**
 * gameVillageView.spec.ts — PLAN-035 (artifact r005, Desiderata v30):
 * the Village view on `/game`.
 *
 * Covers the verification contract in `.mw/runs/plan-035-village-view/`:
 *  BV-2  dual entry (nav plinth + painted village region on the Pixi map),
 *        no `data-building-poi` marker on the continent, WebGL map alive
 *        under the hidden layer (`aria-hidden` + `inert`, opacity 0).
 *  BV-3  icon-first pins, hover-pinnable tooltip (140ms grace, pin button,
 *        X, Escape), single pinned slot.
 *  BV-4  Warehouse → `[Apri Magazzino]` → `villageStash` panel,
 *        Emporium → `[Apri Mercante]` → `merchant` panel.
 *  BV-6  visual witness screenshots (en/it-IT × 1440×900 / 1280×800).
 *
 * Runs against the dev server (playwright.dev-server.config.ts → :5173);
 * `window.__pixiApp` is DEV-only, used for the ticker check.
 */
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EVIDENCE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../test-results/plan-035-village-view');
const VIEW = '[data-testid="village-screen-view"]';
const MAP_LAYER = '[data-testid="world-map-layer"]';
const TOOLTIP = '[data-testid="village-building-tooltip"]';

type HooksWindow = Window & {
  __pixiApp?: { ticker?: { started: boolean } };
  __i18n?: { changeLanguage: (lng: string) => Promise<unknown>; language?: string };
};

/** Wait for the Pixi map to boot AND the boot-screen overlay to clear —
 *  it keeps intercepting pointer events while assets finish (`data-boot-phase`). */
const waitForGame = async (page: Page) => {
  await page.goto('/game');
  await expect(page.locator(`${MAP_LAYER} canvas`).first()).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(() => Boolean((window as HooksWindow).__pixiApp), undefined, { timeout: 60_000 });
  await page.locator('[data-testid="game-boot-screen"]').waitFor({ state: 'detached', timeout: 60_000 }).catch(async () => {
    await expect(page.locator('[data-testid="game-boot-screen"]')).toBeHidden();
  });
};

/** Screen-space village-region pixel: scan a small grid near canvas centre
 *  until the 1s dwell tooltip names the village, then return the point. */
const findVillagePixel = async (page: Page): Promise<{ x: number; y: number }> => {
  const canvas = page.locator(`${MAP_LAYER} canvas`).first();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('map canvas has no box');
  const villageName = /village|villaggio/i;
  /* The village sits just below the map centre; sweep a coarse grid that
   * brackets it, dense enough to land inside the region polygon. */
  const fractions: [number, number][] = [];
  for (const fy of [0.5, 0.54, 0.58, 0.46, 0.62, 0.42]) {
    for (const fx of [0.49, 0.45, 0.53, 0.41, 0.57]) fractions.push([fx, fy]);
  }
  for (const [fx, fy] of fractions) {
    const x = box.x + box.width * fx;
    const y = box.y + box.height * fy;
    await page.mouse.move(x, y);
    /* Dwell is 1s (regionHoverDelayS); give it margin but bail fast. */
    try {
      await expect(page.locator('[role="tooltip"]')).toHaveText(villageName, { timeout: 1600 });
      return { x, y };
    } catch {
      /* wrong region or none — keep scanning */
    }
  }
  throw new Error('village region pixel not found on the map');
};

test.describe('PLAN-035 — Village view on /game', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ locale: 'en-US' });

  test('BV-2a — nav plinth entry: Village opens the view, map stays mounted inert', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();
    /* The continental map is hidden semantically but still mounted + ticking. */
    await expect(page.locator(MAP_LAYER)).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator(MAP_LAYER)).toHaveAttribute('inert', '');
    const tickerAlive = await page.evaluate(
      () => (window as HooksWindow).__pixiApp?.ticker?.started === true,
    );
    expect(tickerAlive, 'Pixi ticker stopped while in village view').toBe(true);
    /* No building markers on the continent anymore (BV-2). */
    await expect(page.locator('[data-building-poi]')).toHaveCount(0);
    /* Nav back to the map. */
    await page.locator('[data-nav-id="map"]').click();
    await expect(page.locator(VIEW)).toHaveCount(0);
    await expect(page.locator(MAP_LAYER)).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('BV-2b — painted village region on the map opens the same view', async ({ page }) => {
    await waitForGame(page);
    const { x, y } = await findVillagePixel(page);
    /* Plain click (down+up within 4px) = the region select path. */
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator(VIEW)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-nav-id="village"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('BV-3 — pins are icon-first; tooltip pins/unpins, survives grace, closes on X and Escape', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();

    const lumbermill = page.locator('[data-building-pin="lumbermill"]');
    const quarry = page.locator('[data-building-pin="quarry"]');
    await expect(lumbermill).toBeVisible();
    /* Icon-first: the pin carries only the glyph + roman level (no name text). */
    await expect(lumbermill).not.toHaveText(/lumbermill/i);

    await lumbermill.hover();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    /* Grace: move onto the tooltip — it must stay open (140ms hoverable). */
    await page.locator(TOOLTIP).hover();
    await page.waitForTimeout(300);
    await expect(page.locator(TOOLTIP)).toBeVisible();

    /* Pin it via the tooltip pin toggle. */
    await page.locator('[data-testid="village-tooltip-pin"]').click();
    await expect(page.locator('[data-testid="village-tooltip-pin"]')).toHaveAttribute('aria-pressed', 'true');
    /* A pinned tooltip stays while another pin is hovered — dispatch the
     * event straight on the pin (the DOM contract), not via a mouse path
     * that crosses whichever pins/panels happen to lie in between. */
    await quarry.dispatchEvent('pointerenter');
    await page.waitForTimeout(300);
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await expect(lumbermill).toHaveAttribute('aria-expanded', 'true');
    await expect(quarry).toHaveAttribute('aria-expanded', 'false');

    /* First Escape: the pinned tooltip closes, the view stays. */
    await page.keyboard.press('Escape');
    await expect(page.locator(TOOLTIP)).toHaveCount(0);
    await expect(page.locator(VIEW)).toBeVisible();
    /* Second Escape: the view itself exits to the map. */
    await page.keyboard.press('Escape');
    await expect(page.locator(VIEW)).toHaveCount(0);
    await expect(page.locator(MAP_LAYER)).not.toHaveAttribute('aria-hidden', 'true');
  });

  test('BV-3b — X button closes the tooltip', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    const pin = page.locator('[data-building-pin="farm"]');
    await pin.hover();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await page.locator(`${TOOLTIP} button[data-skin="close"]`).click();
    await expect(page.locator(TOOLTIP)).toHaveCount(0);
  });

  test('BV-4 — Warehouse opens villageStash, Emporium opens merchant', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();

    const warehouse = page.locator('[data-building-pin="warehouse"]');
    await warehouse.hover();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await page.locator('[data-testid="village-open-stash"]').click();
    await expect(page.locator('[data-hud-panel="villageStash"]')).toBeVisible({ timeout: 10_000 });
    /* The stash panel does not eat Escape — it falls to the village exit. */
    await page.locator('[data-hud-panel="villageStash"] button[data-skin="close"]').first().click();

    const market = page.locator('[data-building-pin="market"]');
    await market.hover();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await page.locator('[data-testid="village-open-merchant"]').click();
    await expect(page.locator('[data-hud-panel="merchant"]')).toBeVisible({ timeout: 10_000 });
  });
});

/* BV-6 visual witness — one screenshot per locale × viewport, saved as
 * evidence under test-results/plan-035-village-view/. */
const shots: { locale: string; tag: string; w: number; h: number; lng: string }[] = [
  { locale: 'en-US', tag: 'en-1440x900', w: 1440, h: 900, lng: 'en' },
  { locale: 'en-US', tag: 'en-1280x800', w: 1280, h: 800, lng: 'en' },
  { locale: 'it-IT', tag: 'it-1440x900', w: 1440, h: 900, lng: 'it-IT' },
  { locale: 'it-IT', tag: 'it-1280x800', w: 1280, h: 800, lng: 'it-IT' },
];

for (const shot of shots) {
  test.describe(`BV-6 visual witness — ${shot.tag}`, () => {
    test.use({ locale: shot.locale, viewport: { width: shot.w, height: shot.h } });
    test(`village view screenshot ${shot.tag}`, async ({ page }) => {
      mkdirSync(EVIDENCE_DIR, { recursive: true });
      await waitForGame(page);
      /* The app re-asserts its persisted locale after init — switch through
       * the DEV i18n handle so the witness shot is really in `shot.lng`. */
      await page.evaluate(async (lng) => {
        await (window as HooksWindow).__i18n?.changeLanguage(lng);
      }, shot.lng);
      await expect
        .poll(async () => page.evaluate(() => (window as HooksWindow).__i18n?.language))
        .toBe(shot.lng);
      await page.locator('[data-nav-id="village"]').click();
      await expect(page.locator(VIEW)).toBeVisible();
      /* Let the fade-in finish and hover a pin for the tooltip state. */
      await page.waitForTimeout(400);
      await page.locator('[data-building-pin="lumbermill"]').hover();
      await expect(page.locator(TOOLTIP)).toBeVisible();
      await page.screenshot({ path: resolve(EVIDENCE_DIR, `village-${shot.tag}.png`), timeout: 30_000 });
    });
  });
}
