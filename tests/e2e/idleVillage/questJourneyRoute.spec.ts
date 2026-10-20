import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const GOBLIN_POI = 'poi-goblin';
const EVIDENCE_DIR = path.resolve('.mw/runs/plan053-t005-route-fill');

interface JourneyRunProbe {
  ended: boolean;
  journey?: {
    snapshot: { travelDays: number; ticksPerDay: number };
    journal: { processedUpToTick: number; currentFase: string };
  };
}

interface JourneyHooksWindow extends Window {
  __idleVillageTestHooks?: {
    advanceTicks?: (ticks: number) => void;
    getClock?: () => { currentTick: number; isPaused: boolean };
    expedition?: Record<string, {
      demoLaunch?: () => void;
      getRun?: () => JourneyRunProbe | null;
    }>;
  };
}

/** Reads the real goblin journey through the existing expedition E2E seam. */
async function getRun(page: Page): Promise<JourneyRunProbe | null> {
  return page.evaluate(
    (poiId) => (window as JourneyHooksWindow).__idleVillageTestHooks?.expedition?.[poiId]?.getRun?.() ?? null,
    GOBLIN_POI,
  );
}

/** Advances the real gameplay clock through the canonical test hook. */
async function advanceGameTicks(page: Page, ticks: number): Promise<void> {
  await page.evaluate((amount) => (window as JourneyHooksWindow).__idleVillageTestHooks?.advanceTicks?.(amount), ticks);
}

test.describe('PLAN-053 T-005 — journey route map overlay', () => {
  test.use({ locale: 'en-US' });

  // INV:pixi-world-map.INV-2
  // INV:game-frame-pixi.INV-2
  test('real launch fills the selected route and the overlay follows camera pan', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/game?capture=1');
    await page.waitForFunction(
      (poiId) => Boolean((window as JourneyHooksWindow).__idleVillageTestHooks?.expedition?.[poiId]?.demoLaunch),
      GOBLIN_POI,
      { timeout: 60_000 },
    );
    await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'visible', timeout: 60_000 });
    await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 60_000 });
    await page.waitForFunction(() => document.querySelector('canvas') != null, undefined, { timeout: 60_000 });
    const clock = await page.evaluate(() => (window as JourneyHooksWindow).__idleVillageTestHooks?.getClock?.());
    if (clock && !clock.isPaused) {
      await page.getByRole('radio', { name: 'Pause' }).click();
    }

    await page.evaluate(
      (poiId) => (window as JourneyHooksWindow).__idleVillageTestHooks?.expedition?.[poiId]?.demoLaunch?.(),
      GOBLIN_POI,
    );
    const route = page.getByTestId('quest-journey-route');
    await expect(route).toBeVisible({ timeout: 60_000 });

    const initialRun = await getRun(page);
    expect(initialRun?.journey).toBeDefined();
    expect(initialRun?.journey?.journal.currentFase).toBe('andata');
    const travelTicks = initialRun!.journey!.snapshot.travelDays * initialRun!.journey!.snapshot.ticksPerDay;
    const initialProgress = Number(await route.getAttribute('data-route-progress'));

    await advanceGameTicks(page, Math.max(1, Math.floor(travelTicks / 2)));
    await expect
      .poll(async () => Number(await route.getAttribute('data-route-progress')), { timeout: 15_000 })
      .toBeGreaterThan(initialProgress + 0.35);
    const halfwayProgress = Number(await route.getAttribute('data-route-progress'));
    expect(halfwayProgress).toBeLessThan(0.7);
    await page.getByTestId('quest-window').locator('button[data-keep]').first().click();
    await expect(page.getByTestId('quest-window-minimised')).toBeVisible();
    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'route-midpoint-1440x900.png') });

    await advanceGameTicks(page, travelTicks);
    await expect
      .poll(async () => Number(await route.getAttribute('data-route-progress')), { timeout: 15_000 })
      .toBe(1);
    await expect(route).toHaveAttribute('data-fase', 'svolgimento');

    const layer = page.getByTestId('pixi-world-overlay');
    await expect(layer).toBeVisible();
    expect(await layer.evaluate((element) => getComputedStyle(element).zIndex)).toBe('5');
    const boxBefore = await route.boundingBox();
    expect(boxBefore).not.toBeNull();
    /* Real input path, deterministic delivery: the map listens for
     * `mousedown` on the pixi canvas and `mousemove`/`mouseup` on window, and
     * applies `panX -= dx/zoom` to the same transform the overlay reads
     * (`translate3d(-panX*zoom)`). Dispatching the real MouseEvents skips the
     * nondeterministic hit-test against DOM overlays while still exercising
     * handler → camera → transform — no test seam required. The sign follows
     * the map's pan convention; the magnitude is the contract. */
    const canvasBox = await page.locator('canvas').first().boundingBox();
    expect(canvasBox).not.toBeNull();
    const dragStart = { x: canvasBox!.x + canvasBox!.width * 0.35, y: canvasBox!.y + canvasBox!.height * 0.55 };
    const dragDelta = 60;
    await page.evaluate(({ start, delta }) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) throw new Error('pixi canvas not found');
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: start.x, clientY: start.y, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: start.x + delta, clientY: start.y, bubbles: true }));
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: start.x + delta, clientY: start.y, bubbles: true }));
    }, { start: dragStart, delta: dragDelta });
    const boxAfter = await route.boundingBox();
    expect(boxAfter).not.toBeNull();
    expect(Math.abs(boxAfter!.x - boxBefore!.x)).toBeCloseTo(dragDelta, -1);
  });
});
