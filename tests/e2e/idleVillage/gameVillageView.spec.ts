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

/* PLAN-038 (artifact-r003): the pin language + painted-over slot overlay.
 *  BV-7a structural grammar; BV-7b pin→region glow; BV-7c disclosure UI. */
test.describe('PLAN-038 — pin language & slot overlay', () => {
  test.use({ locale: 'en-US' });

  test('BV-7a — overlay is inert (aria-hidden, pointer-events:none) with one g[data-region] per building and state grammar', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();

    const overlay = page.locator('[data-testid="village-slot-overlay"]');
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');
    await expect(overlay).toHaveCSS('pointer-events', 'none');

    /* 11 stable groups, tagged by state; pop-in leaves them opaque. */
    const groups = overlay.locator('g[data-region]');
    await expect(groups).toHaveCount(11);
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[data-testid="village-slot-overlay"] g[data-region]')]
        .every((g) => Number(getComputedStyle(g).opacity) === 1 || getComputedStyle(g).scale !== '0'),
    );

    /* Grammar: built → no dashed ring; buildable → dashed ring; locked →
     * dotted ring + vignette. Barracks/infirmary are the locked fixtures,
     * inn/smithy/watchtower the buildable ones. */
    for (const id of ['inn', 'smithy', 'watchtower']) {
      await expect(overlay.locator(`g[data-region="${id}"] ellipse[stroke-dasharray]`).first()).toBeAttached();
    }
    for (const id of ['infirmary', 'barracks']) {
      await expect(overlay.locator(`g[data-region="${id}"] ellipse[stroke-dasharray]`).first()).toBeAttached();
      await expect(overlay.locator(`g[data-region="${id}"] ellipse[fill^="url(#vslot-scrim"]`)).toBeAttached();
    }
    for (const id of ['lumbermill', 'quarry', 'farm', 'warehouse', 'market', 'palisade']) {
      await expect(overlay.locator(`g[data-region="${id}"] ellipse[stroke-dasharray]`)).toHaveCount(0);
    }
  });

  test('BV-7b — pins carry frame/state data and a badge tab; hovering a pin lights its region', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();

    /* Category frames and badge semantics on three archetypes. */
    await expect(page.locator('[data-building-pin="barracks"]')).toHaveAttribute('data-pin-frame', 'shield');
    await expect(page.locator('[data-building-pin="smithy"]')).toHaveAttribute('data-pin-frame', 'banner');
    await expect(page.locator('[data-building-pin="farm"]')).toHaveAttribute('data-pin-frame', 'roundel');
    await expect(page.locator('[data-building-pin="barracks"]')).toHaveAttribute('data-pin-state', 'locked');
    await expect(page.locator('[data-building-pin="inn"]')).toHaveText('+');
    await expect(page.locator('[data-building-pin="farm"]')).toHaveText('II');

    /* Pin→region glow (:has): before hover the ping is transparent; after a
     * real pointer hover (only :hover can feed :has()) it goes solid — and the
     * overlay still eats no events. */
    const ping = page.locator('g[data-region="smithy"] .vslot-ping');
    await expect(ping).toHaveCSS('opacity', '0');
    await page.locator('[data-building-pin="smithy"]').hover();
    await expect(ping).toHaveCSS('opacity', '1');
    await expect(page.locator(TOOLTIP)).toBeVisible();
  });

  test('BV-7c — settlement plaque and visual legend are rendered inside the stage', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();
    await expect(page.locator('[data-testid="village-plaque"]')).toContainText('Village');
    await expect(page.locator('[data-testid="village-plaque"]')).toContainText('of 16 built');
    await expect(page.locator('[data-testid="village-legend"]')).toBeVisible();
    await expect(page.locator('[data-testid="village-legend"]')).toContainText('Esc');
  });
});

/* PLAN-042 (artifact-r005): the Settlement Registry drawer — chip + `r`
 *  hotkey, category sections, painted/registry rows, drill-in card, shared
 *  activeBuildingId highlight, focus-scoped Escape order, viewport matrix. */
const REGISTRY = '[data-testid="village-registry"]';
const CHIP = '[data-testid="village-registry-chip"]';
const EVIDENCE_DIR_042 = resolve(dirname(fileURLToPath(import.meta.url)), '../../../test-results/plan-042-village-registry');

test.describe('PLAN-042 — Settlement Registry drawer', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ locale: 'en-US' });

  test('BV-8a — chip opens the drawer, `r` toggles it, sections list the full catalog', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();

    /* Closed by default; the chip is visible with the pending-count badge. */
    const chip = page.locator(CHIP);
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('aria-expanded', 'false');
    await expect(chip).toHaveAttribute('aria-controls', 'village-registry');

    await chip.click();
    const drawer = page.locator(REGISTRY);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'complementary');
    await expect(chip).toHaveAttribute('aria-expanded', 'true');

    /* 4 category sections; default-expanded sections carry 13 rows (the
     *  production section starts collapsed — no buildable entries in it). */
    await expect(page.locator('[data-registry-section]')).toHaveCount(4);
    await expect(page.locator('[data-registry-section="arcane"]')).toBeVisible();
    await expect(page.locator('[data-registry-row]')).toHaveCount(13);
    /* Expand production → all 16 catalog rows. */
    await page.locator('[data-registry-section="production"] > button').click();
    await expect(page.locator('[data-registry-row]')).toHaveCount(16);
    await expect(page.locator('[data-registry-row="mageTower"]')).toBeVisible();

    /* `r` closes it; `r` again reopens. Focus must not be in a field. */
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.keyboard.press('r');
    await expect(drawer).toBeHidden();
    await page.keyboard.press('r');
    await expect(drawer).toBeVisible();
  });

  test('BV-8b — Escape order: card → drawer → tooltip → map (one layer per keypress)', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await expect(page.locator(VIEW)).toBeVisible();

    const drawer = page.locator(REGISTRY);
    await page.locator(CHIP).click();
    await expect(drawer).toBeVisible();

    /* Drill into a registry-only row → the card is the topmost layer. */
    await page.locator('[data-registry-row="mageTower"]').click();
    await expect(page.locator('[data-testid="village-registry-card"]')).toBeVisible();

    /* Esc 1: card closes, drawer stays, focus returns to the row. */
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="village-registry-card"]')).toHaveCount(0);
    await expect(drawer).toBeVisible();
    await expect(page.locator('[data-registry-row="mageTower"]')).toBeFocused();

    /* Esc 2: drawer closes, view stays, focus lands on the chip. */
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.locator(VIEW)).toBeVisible();
    await expect(page.locator(CHIP)).toBeFocused();

    /* Pin a tooltip, open the drawer again, then drain the stack. */
    await page.locator('[data-building-pin="smithy"]').click();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await page.locator(CHIP).click();
    await expect(drawer).toBeVisible();
    /* Esc: drawer first (it is above the tooltip in the stack). */
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    /* Esc: the pinned tooltip. */
    await page.keyboard.press('Escape');
    await expect(page.locator(TOOLTIP)).toHaveCount(0);
    /* Esc: the view exits to the map. */
    await page.keyboard.press('Escape');
    await expect(page.locator(VIEW)).toHaveCount(0);
  });

  test('BV-8c — row hover pings the painted footprint; registry-only rows glow internally', async ({ page }) => {
    await waitForGame(page);
    await page.locator('[data-nav-id="village"]').click();
    await page.locator(CHIP).click();
    await expect(page.locator(REGISTRY)).toBeVisible();

    /* Painted row hover → data-highlight on the footprint + pin ping. */
    const smithyRow = page.locator('[data-registry-row="smithy"]');
    await smithyRow.hover();
    await expect(page.locator('g[data-region="smithy"]')).toHaveAttribute('data-highlight', 'true');
    await expect(page.locator('g[data-region="smithy"] .vslot-ping')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-building-pin="smithy"]')).toHaveAttribute('data-active', 'true');

    /* Registry-only row: internal glow, NO ghost ellipse on the painting. */
    await page.locator('[data-registry-row="mageTower"]').hover();
    await expect(page.locator('g[data-region="mageTower"]')).toHaveCount(0);
    await expect(page.locator('[data-registry-row="mageTower"]')).toHaveAttribute('data-active', 'true');

    /* Painted row click → the stage tooltip pins. Stack order: the drawer is
     *  ABOVE the tooltip, so the first Escape closes the drawer (focus →
     *  chip), the second closes the tooltip (focus → pin). */
    await page.locator('[data-registry-row="smithy"]').click();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(REGISTRY)).toBeHidden();
    await expect(page.locator(TOOLTIP)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(TOOLTIP)).toHaveCount(0);
    await expect(page.locator('[data-building-pin="smithy"]')).toBeFocused();
  });
});

/* BV-8d witness — drawer open + card + locales at the viewport matrix. */
const shots042: { locale: string; tag: string; w: number; h: number; lng: string }[] = [
  { locale: 'en-US', tag: 'en-1280x800', w: 1280, h: 800, lng: 'en' },
  { locale: 'en-US', tag: 'en-1440x900', w: 1440, h: 900, lng: 'en' },
  { locale: 'en-US', tag: 'en-1920x1080', w: 1920, h: 1080, lng: 'en' },
  { locale: 'it-IT', tag: 'it-1440x900', w: 1440, h: 900, lng: 'it-IT' },
  { locale: 'it-IT', tag: 'it-1280x800', w: 1280, h: 800, lng: 'it-IT' },
];

for (const shot of shots042) {
  test.describe(`BV-8d visual witness — ${shot.tag}`, () => {
    test.use({ locale: shot.locale, viewport: { width: shot.w, height: shot.h } });
    test(`registry drawer screenshot ${shot.tag}`, async ({ page }) => {
      mkdirSync(EVIDENCE_DIR_042, { recursive: true });
      await waitForGame(page);
      await page.evaluate(async (lng) => {
        await (window as HooksWindow).__i18n?.changeLanguage(lng);
      }, shot.lng);
      await expect
        .poll(async () => page.evaluate(() => (window as HooksWindow).__i18n?.language))
        .toBe(shot.lng);
      await page.locator('[data-nav-id="village"]').click();
      await expect(page.locator(VIEW)).toBeVisible();
      await page.waitForTimeout(400);
      /* Open the drawer and hover a painted row for the highlight state
       *  (smithy is civic — its section starts expanded). */
      await page.locator(CHIP).click();
      await expect(page.locator(REGISTRY)).toBeVisible();
      await page.locator('[data-registry-row="smithy"]').hover();
      await expect(page.locator('g[data-region="smithy"]')).toHaveAttribute('data-highlight', 'true');
      await page.screenshot({ path: resolve(EVIDENCE_DIR_042, `registry-${shot.tag}.png`), timeout: 30_000 });
      /* The drill-in card on the first registry-only special. */
      await page.locator('[data-registry-row="mageTower"]').click();
      await expect(page.locator('[data-testid="village-registry-card"]')).toBeVisible();
      await page.screenshot({ path: resolve(EVIDENCE_DIR_042, `registry-card-${shot.tag}.png`), timeout: 30_000 });
    });
  });
}
