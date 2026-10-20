import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const GOBLIN_POI = 'poi-goblin';
const EVIDENCE_DIR = path.resolve('.mw/runs/plan053-t006-journey-detail');

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

test.describe('PLAN-053 T-006 — journey detail strip in the quest window', () => {
  test.use({ locale: 'en-US' });

  test('real launch mounts the three legs and they follow the journal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/game?capture=1');
    await page.waitForFunction(
      (poiId) => Boolean((window as JourneyHooksWindow).__idleVillageTestHooks?.expedition?.[poiId]?.demoLaunch),
      GOBLIN_POI,
      { timeout: 60_000 },
    );
    await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'visible', timeout: 60_000 });
    await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 60_000 });
    const clock = await page.evaluate(() => (window as JourneyHooksWindow).__idleVillageTestHooks?.getClock?.());
    if (clock && !clock.isPaused) {
      await page.getByRole('radio', { name: 'Pause' }).click();
    }

    await page.evaluate(
      (poiId) => (window as JourneyHooksWindow).__idleVillageTestHooks?.expedition?.[poiId]?.demoLaunch?.(),
      GOBLIN_POI,
    );
    const strip = page.getByTestId('quest-journey-phases');
    await expect(strip).toBeVisible({ timeout: 60_000 });
    await expect(strip).toHaveAttribute('data-fase', 'andata');

    /* Three legs: andata/ritorno carry the authored 2d label, svolgimento the
     * live ~Nd estimate; only the current leg is lit. */
    const legs = strip.getByTestId('quest-journey-fase');
    await expect(legs).toHaveCount(3);
    await expect(strip.locator('[data-fase="andata"]')).toHaveAttribute('data-current', 'true');
    const outboundStart = Number(await strip.locator('[data-fase="andata"]').getAttribute('data-progress'));
    expect(outboundStart).toBeLessThan(0.2);

    const run = await getRun(page);
    expect(run?.journey).toBeDefined();
    const travelTicks = run!.journey!.snapshot.travelDays * run!.journey!.snapshot.ticksPerDay;

    await advanceGameTicks(page, Math.max(1, Math.floor(travelTicks / 2)));
    await expect
      .poll(async () => Number(await strip.locator('[data-fase="andata"]').getAttribute('data-progress')), { timeout: 15_000 })
      .toBeGreaterThan(0.3);

    await advanceGameTicks(page, travelTicks);
    await expect(strip).toHaveAttribute('data-fase', 'svolgimento', { timeout: 15_000 });
    await expect(strip.locator('[data-fase="andata"]')).toHaveAttribute('data-progress', '1.0000');
    await expect(strip.locator('[data-fase="svolgimento"]')).toHaveAttribute('data-current', 'true');

    mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase-strip-svolgimento-1440x900.png') });
  });
});
