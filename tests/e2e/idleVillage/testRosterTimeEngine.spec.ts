/**
 * Test Roster – Time Engine integration spec
 *
 * Covers the compact Time Engine controls rendered on the /test route.
 * Validates pause/play wiring, day/night phase transitions, and speed controls.
 */

import { test, expect, type Page } from '@playwright/test';

const TEST_ROUTE = '/test';

type TimeEngineState = {
  progress: number;
  currentDay: number;
  isPaused: boolean;
  speedMultiplier: number;
  phase: 'day' | 'night' | string;
};

async function gotoTestRoute(page: Page) {
  await page.goto(TEST_ROUTE);
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('test-roster-page')).toBeVisible();
}

async function getTimeEngineState(page: Page): Promise<TimeEngineState> {
  const surface = page.getByTestId('style-lab-time-engine');
  return surface.evaluate((node) => {
    if (!(node instanceof HTMLElement)) {
      return {
        progress: 0,
        currentDay: 0,
        isPaused: true,
        speedMultiplier: 1,
        phase: 'day',
      } satisfies TimeEngineState;
    }
    return {
      progress: Number(node.dataset.timeEngineProgress ?? '0'),
      currentDay: Number(node.dataset.timeEngineCurrentDay ?? '0'),
      isPaused: node.dataset.timeEngineIsPaused === 'true',
      speedMultiplier: Number(node.dataset.timeEngineSpeedMultiplier ?? '1'),
      phase: (node.dataset.timeEnginePhase as 'day' | 'night' | string) ?? 'day',
    } satisfies TimeEngineState;
  });
}

async function toggleTimeEngine(page: Page) {
  await page.getByTestId('day-night-card').click();
}

async function ensurePaused(page: Page) {
  const state = await getTimeEngineState(page);
  if (!state.isPaused) {
    await toggleTimeEngine(page);
    await expect.poll(async () => (await getTimeEngineState(page)).isPaused).toBe(true);
  }
}

async function ensurePlaying(page: Page) {
  const state = await getTimeEngineState(page);
  if (state.isPaused) {
    await toggleTimeEngine(page);
    await expect.poll(async () => (await getTimeEngineState(page)).isPaused).toBe(false);
  }
}

async function waitForProgressIncrease(page: Page, minDelta = 0.02, timeout = 8000) {
  const initial = (await getTimeEngineState(page)).progress;
  await expect
    .poll(async () => (await getTimeEngineState(page)).progress, { timeout })
    .toBeGreaterThan(initial + minDelta);
}

async function setSpeed(page: Page, speed: number) {
  const label = `Set speed to ${Number(speed.toFixed(2))}×`;
  await page.getByRole('button', { name: label }).click();
  await expect
    .poll(async () => Number((await getTimeEngineState(page)).speedMultiplier.toFixed(2)))
    .toBe(Number(speed.toFixed(2)));
}

async function measureProgressDelta(page: Page, durationMs: number) {
  const start = (await getTimeEngineState(page)).progress;
  await page.waitForTimeout(durationMs);
  let end = (await getTimeEngineState(page)).progress;
  if (end < start) {
    end += 1; // handle wrap-around between days
  }
  return end - start;
}

test.describe('@test-route Test Roster – Time Engine', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await gotoTestRoute(page);
  });

  test.afterEach(async ({ page }) => {
    await ensurePaused(page);
  });

  test('@test-route time engine toggles play and pause states', async ({ page }) => {
    const initial = await getTimeEngineState(page);
    expect(initial.isPaused).toBe(true);

    await toggleTimeEngine(page);
    await expect.poll(async () => (await getTimeEngineState(page)).isPaused).toBe(false);
    await waitForProgressIncrease(page);
    const progressWhileRunning = (await getTimeEngineState(page)).progress;

    await toggleTimeEngine(page);
    await expect.poll(async () => (await getTimeEngineState(page)).isPaused).toBe(true);
    await page.waitForTimeout(1500);
    const progressWhilePaused = (await getTimeEngineState(page)).progress;

    // Tolerance: one extra tick (~0.017 for 60s cycle) may fire between toggle and pause propagation
    expect(progressWhilePaused).toBeLessThanOrEqual(progressWhileRunning + 0.025);
  });

  test('@test-route day/night card transitions to night phase while running', async ({ page }) => {
    const initial = await getTimeEngineState(page);
    expect(initial.phase).toBe('day');

    await ensurePlaying(page);
    await setSpeed(page, 3);

    await expect
      .poll(async () => (await getTimeEngineState(page)).phase, { timeout: 15000 })
      .toBe('night');

    const stateAfter = await getTimeEngineState(page);
    expect(stateAfter.isPaused).toBe(false);
  });

  test('@test-route clock widget speed controls affect progression rate', async ({ page }) => {
    await ensurePlaying(page);
    await setSpeed(page, 1);

    const slowDelta = await measureProgressDelta(page, 3000);

    await setSpeed(page, 3);
    const fastDelta = await measureProgressDelta(page, 3000);

    expect(fastDelta).toBeGreaterThan(slowDelta * 1.8);
  });
});
