/**
 * steamCapture.spec.ts — R-117: Steam "Coming Soon" screenshot candidates.
 *
 * Captures REAL in-engine frames from the canonical `/game` surface at
 * 1920×1080 — no mocks, no staging pages, same rules as the refined plan:
 * every shot must be a scene the build actually produces.
 *
 * Output: test-results/steam-capture/*.png (candidates — final pick goes
 * through the Director + the comprehension test, never straight to Steam).
 *
 * Driving uses `__idleVillageTestHooks.expedition` — the same contract as
 * gameQuestLifecycle.spec.ts: the hooks apply the same rules as the real
 * UI path (assignment eligibility, clock-driven frontiers).
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'test-results/steam-capture';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const VALID_MEMBER = 'hero-giggiolillo';

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    getClock?: () => { currentTick: number; isPaused: boolean; speedMultiplier: number };
  };
}

const expedition = async <T,>(page: Page, action: string, ...args: unknown[]): Promise<T> => {
  const result = await page.evaluate(
    ({ act, fnArgs }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act](...fnArgs);
    },
    { act: action, fnArgs: args },
  );
  return result as T;
};

const advanceTicks = (page: Page, n: number) =>
  page.evaluate((ticks) => (window as TestHooksWindow).__idleVillageTestHooks?.advanceTicks?.(ticks), n);

const shot = async (page: Page, name: string) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
};

/** Boot /game at Steam resolution and wait for the live map.
 *  `?capture=1` = the build's own clean-shot mode (no Director/panel menu) —
 *  the quest offers are revealed through the test seam the Director drives. */
const bootGame = async (page: Page, tod?: 'day' | 'dusk' | 'night') => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`/game?capture=1${tod ? `&tod=${tod}` : ''}`);
  await page.waitForFunction(() => window.__idleVillageTestHooks, { timeout: 30_000 });
  await page.evaluate(() => window.__idleVillageTestHooks?.revealQuestPois?.());
  await expect(page.locator(`[data-quest-poi-id="${POI}"]`)).toBeVisible({ timeout: 20_000 });
  /* Let the atmospheric layers (waves/birds/clouds) settle into a frame. */
  await page.waitForTimeout(2500);
};

/* Steam page EN copy needs an EN UI: the i18n detector reads `navigator`
 * first and caches nothing, so the browser locale drives the language. */
test.use({ locale: 'en-US' });

test.describe('R-117 — Steam capture candidates', () => {
  test.beforeEach(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test('capture: map, planner, quest run, choice', async ({ page }) => {
    await bootGame(page);

    /* --- Shot 1: the living map, clean HUD --- */
    await shot(page, '01-map-living');

    /* --- Shot 2: POI detail = the planner (party/forecast/intel) --- */
    await page.locator(`[data-quest-poi-id="${POI}"]`).click();
    await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();
    await page.waitForTimeout(600);
    await shot(page, '02-planner-empty');

    /* --- Shot 3: planner with a real party assigned + forecast ready --- */
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, VALID_MEMBER).catch(() => false);
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 20_000 });
    await page.waitForTimeout(800);
    await shot(page, '03-planner-party-forecast');

    /* --- Launch: send the expedition, QuestRunWindow opens --- */
    await page.getByTestId('quest-expedition-send').click();
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800);
    await shot(page, '04-quest-run-start');

    /* --- Shot 5: a real waiting decision inside the run --- */
    type RunShape = { ended: boolean; nodeId: string; frontier: { status: string } };
    let run = await expedition<RunShape>(page, 'getRun');
    for (let i = 0; i < 40 && run && !run.ended && run.frontier.status !== 'waiting'; i++) {
      await advanceTicks(page, 15);
      await page.waitForTimeout(300);
      run = await expedition<RunShape>(page, 'getRun');
    }
    if (run && run.frontier.status === 'waiting') {
      await page.waitForTimeout(500);
      await shot(page, '05-quest-choice');
    }

    /* --- Shot 6: mid-run state after a choice (consequences visible) --- */
    if (run && run.frontier.status === 'waiting') {
      const options = await expedition<string[]>(page, 'getOptions');
      if (options.length) {
        await expedition<void>(page, 'choose', options[0]);
        await page.waitForTimeout(700);
        await shot(page, '06-quest-consequence');
      }
    }
  });

  test('capture: map after settlement (POI consumed)', async ({ page }) => {
    await bootGame(page);
    await page.locator(`[data-quest-poi-id="${POI}"]`).click();
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await page.getByTestId('quest-expedition-send').click();
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });

    /* Drive the run to its terminal state (same loop as lifecycle spec). */
    type RunShape = {
      ended: boolean;
      nodeId: string;
      frontier: { status: string; readyAt: number };
    };
    let lastNode = '';
    let repeats = 0;
    for (let i = 0; i < 120; i++) {
      const run = await expedition<RunShape>(page, 'getRun');
      if (!run || run.ended) break;
      if (run.frontier.status === 'waiting') {
        const options = await expedition<string[]>(page, 'getOptions');
        repeats = run.nodeId === lastNode ? repeats + 1 : 0;
        lastNode = run.nodeId;
        await expedition<void>(page, 'choose', options[Math.min(repeats, options.length - 1)]);
        await page.waitForTimeout(300);
      } else {
        await advanceTicks(page, 15);
        await page.waitForTimeout(300);
      }
    }
    await page.waitForTimeout(700);
    await shot(page, '07-quest-outcome');
  });
});
