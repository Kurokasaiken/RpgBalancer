/**
 * gameQuestPlannerLayout.spec.ts — PLAN-036 / R-195 BV-1·BV-2·BV-4: the
 * two-plaque expedition planner, verified GEOMETRICALLY (rendered boxes,
 * never arithmetic budgets) across the ratified viewport matrix.
 *
 *   ≥ `minZeroScrollViewportHeightPx` (720): the left plaque shows ZERO
 *     internal overflow (`scrollHeight ≤ clientHeight + 1`) and the
 *     anchored send CTA sits inside the viewport.
 *   < 720: internal body scroll is legal; the CTA still lands on screen
 *     and a resize re-clamps the WHOLE assembly (main + sidecar + picker).
 *
 *   BV-4: the forecast sidecar is an external sibling plaque — at widths
 *   ≥ 840 CSS px it renders to the RIGHT of the main plaque, and it names
 *   each scenario's authored key-stat tiers verbatim (Goblin: Primaria
 *   Forza / Secondaria Percezione; Rovine: Primaria Forza / Secondarie
 *   Percezione·Costituzione·Destrezza).
 *
 *   Every test asserts zero `pageerror` and zero `console.error` (BV-5's
 *   error-free contract on the planning surface).
 */
import { test, expect, type Page } from '@playwright/test';

const POI = 'poi-goblin';
const POI_ROVINE = 'poi-rovine';
/** `QUEST_PLANNER_INFO.layout.minZeroScrollViewportHeightPx` — duplicated
 *  here so a config drift fails loudly instead of silently re-tuning the
 *  assert. */
const ZERO_SCROLL_MIN_HEIGHT = 720;

interface HooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    revealQuestPois?: () => void;
  };
}

const callHook = (page: Page, poiId: string, action: string) =>
  page.evaluate(
    ({ pid, act }) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid];
      if (typeof exp?.[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act]();
    },
    { pid: poiId, act: action },
  );

/** Collect console errors + pageerrors; assert both empty at test end. */
const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
};

const openPlanner = async (page: Page, poiId = POI) => {
  await callHook(page, poiId, 'openDetail');
  await expect(page.getByTestId(`floating-panel-quest-expedition-${poiId}`)).toBeVisible();
};

const planner = (page: Page, poiId = POI) => page.getByTestId(`floating-panel-quest-expedition-${poiId}`);
const scrollRegion = (page: Page) => page.getByTestId('quest-expedition-detail');
const sendBtn = (page: Page) => page.getByTestId('quest-expedition-send');
const sidecar = (page: Page) => page.getByTestId('quest-expedition-forecast-column');

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  await page.waitForFunction(
    ([g, r]) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[g]) && Boolean(exp?.[r]);
    },
    [POI, POI_ROVINE],
    { timeout: 30_000 },
  );
  await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.revealQuestPois?.());
});

test.describe('PLAN-036 — planner two-plaque geometry (BV-1/BV-2/BV-4)', () => {
  for (const [w, h] of [
    [1280, 720],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`viewport ${w}×${h} (≥${ZERO_SCROLL_MIN_HEIGHT}): zero internal overflow, CTA and sidecar on screen`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: w, height: h });
      await openPlanner(page);

      /* BV-1: left plaque has NO internal overflow. */
      const overflow = await scrollRegion(page).evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(overflow).toBeLessThanOrEqual(1);

      /* The anchored CTA is visible and its bottom stays inside the
       *  viewport (12px breathing room, per the ratified contract). */
      const sendBox = await sendBtn(page).boundingBox();
      expect(sendBox).not.toBeNull();
      expect(sendBox!.y + sendBox!.height).toBeLessThanOrEqual(h - 12);

      /* BV-4: external sidecar plaque to the RIGHT of the main one. */
      const mainBox = await planner(page).boundingBox();
      const sideBox = await sidecar(page).boundingBox();
      expect(sideBox!.x).toBeGreaterThanOrEqual(mainBox!.x + mainBox!.width - 1);
      expect(sideBox!.x + sideBox!.width).toBeLessThanOrEqual(w + 1);

      /* BV-2: cinema banner under the subtitle, ~21:9, real pixels. */
      const cinema = page.getByTestId('quest-expedition-cinema');
      await expect(cinema).toBeVisible();
      const cb = await cinema.boundingBox();
      expect(cb!.width / cb!.height).toBeGreaterThanOrEqual(2.6);
      expect(await cinema.locator('img').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

      expect(errors).toEqual([]);
    });
  }

  test('viewport 800×600 (<720): internal scroll allowed, CTA still on screen, resize re-clamps the assembly', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPlanner(page);
    /* Shrink under the zero-scroll threshold AFTER the panel opened — the
     *  resize handler must re-clamp the complete paired layout. */
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300); // let the resize listener run

    const sendBox = await sendBtn(page).boundingBox();
    expect(sendBox).not.toBeNull();
    expect(sendBox!.y + sendBox!.height).toBeLessThanOrEqual(600 + 1);
    /* The whole assembly stays inside the viewport (sidecar wraps under). */
    for (const el of [planner(page), sidecar(page)]) {
      const box = await el.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(800 + 1);
    }
    expect(errors).toEqual([]);
  });

  test('drag to the far corner clamps the WHOLE paired layout inside the viewport', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const handle = page.getByTestId(`floating-panel-header-quest-expedition-${POI}`);
    const hb = await handle.boundingBox();
    await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
    await page.mouse.down();
    await page.mouse.move(10, 10, { steps: 12 });
    await page.mouse.move(1430, 890, { steps: 12 }); // past the corner — clamp must hold
    await page.mouse.up();
    for (const el of [planner(page), sidecar(page)]) {
      const box = await el.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.y).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1440 + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(900 + 1);
    }
    expect(errors).toEqual([]);
  });

  test('both scenarios render their authored key-stat tiers verbatim', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    /* Goblin Extermination — Primaria: Forza · Secondaria: Percezione. */
    await openPlanner(page, POI);
    await expect(page.getByTestId('forecast-primary-stats')).toContainText(/strength|forza/i);
    const gobSec = page.getByTestId('forecast-secondary-stats');
    await expect(gobSec).toContainText(/perception|percezione/i);
    await page.getByTestId(`floating-panel-close-quest-expedition-${POI}`).click();

    /* Rovine — Primaria: Forza · Secondarie: Percezione+Costituzione+Destrezza. */
    await openPlanner(page, POI_ROVINE);
    await expect(page.getByTestId('forecast-primary-stats')).toContainText(/strength|forza/i);
    const rovSec = page.getByTestId('forecast-secondary-stats');
    await expect(rovSec).toContainText(/perception|percezione/i);
    await expect(rovSec).toContainText(/constitution|costituzione/i);
    await expect(rovSec).toContainText(/agility|agilità|destrezza/i);
    expect(errors).toEqual([]);
  });
});
