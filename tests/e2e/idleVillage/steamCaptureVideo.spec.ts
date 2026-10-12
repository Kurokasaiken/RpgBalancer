/**
 * steamCaptureVideo.spec.ts — R-117: Steam trailer slot-1 clip.
 *
 * A ~25s authentic gameplay beat recorded straight off the canonical
 * `/game` surface (Playwright video at 1920×1080): living map → planner →
 * send → run opener → a real waiting decision → consequence. No staged
 * scenes, no fake continuity — the sequence is what a player would see.
 *
 * Output: test-results/.artifacts (per-test dir, video.webm — trimmed later
 * with ffmpeg).
 */

import { test, expect, type Page } from '@playwright/test';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const VALID_MEMBER = 'hero-giggiolillo';

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    revealQuestPois?: () => void;
  };
}

test.use({
  locale: 'en-US',
  viewport: { width: 1920, height: 1080 },
  video: { mode: 'on', size: { width: 1920, height: 1080 } },
});

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

test('Steam trailer clip: map → planner → send → choice → consequence', async ({ page }) => {
  await page.goto('/game?capture=1');
  await page.waitForFunction(() => window.__idleVillageTestHooks, { timeout: 30_000 });
  /* `?capture=1` hides the Director — reveal the quest offers through the
   *  same seam the «Mostra quest» action drives (R-124: no POI before it). */
  await page.evaluate(() => (window as TestHooksWindow).__idleVillageTestHooks?.revealQuestPois?.());
  await expect(page.locator(`[data-quest-poi-id="${POI}"]`)).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(3500); // breathe on the living map

  await page.locator(`[data-quest-poi-id="${POI}"]`).click();
  await page.waitForTimeout(2500); // read the planner

  await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
  await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, VALID_MEMBER).catch(() => false);
  await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 20_000 });
  await page.waitForTimeout(2500); // forecast visible

  await page.getByTestId('quest-expedition-send').click();
  await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(3000); // read the run opener

  type RunShape = { ended: boolean; frontier: { status: string } };
  let run = await expedition<RunShape>(page, 'getRun');
  for (let i = 0; i < 30 && run && !run.ended && run.frontier.status !== 'waiting'; i++) {
    await advanceTicks(page, 15);
    await page.waitForTimeout(400);
    run = await expedition<RunShape>(page, 'getRun');
  }
  await page.waitForTimeout(3500); // hold on the choice
  const options = await expedition<string[]>(page, 'getOptions');
  if (options.length) {
    await expedition<void>(page, 'choose', options[0]);
    await page.waitForTimeout(3000); // consequence lands
  }
});
