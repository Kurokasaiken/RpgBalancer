/**
 * gameQuestInputCoordination.spec.ts — PLAN-060 (R-231 Plan A): input
 * coordination between the quest window and the frame-level speed keys.
 *
 * Contract being guarded:
 *  - While a choice is pending (options enabled), keys 1-9 select the option
 *    and must NOT change game speed (quest window owns the key, capture phase,
 *    `defaultPrevented` honored by the frame listener).
 *  - While NO selection is pending (locked frontier / pending node), keys 1-9
 *    keep driving time speed — Director ruling 2026-10-19.
 *  - While a beat is presenting, keys advance the beat and do not change speed.
 *  - Frontier verify: `readyAt` maturation enables the option and a real click
 *    advances the phase (the #1 "Recover the loot" complaint).
 *
 * Driver boundary: real `demoLaunch` send path, real `choose`, canonical
 * `advanceTicks` clock — same seams as gameQuestCluster.spec.ts.
 */
import { test, expect, type Page } from '@playwright/test';

const POI = 'poi-goblin';

type RunShape = {
  ended: boolean;
  nodeId: string;
  frontier: { status: string; readyAt: number };
};

interface HooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    getClock?: () => { currentTick: number; isPaused: boolean; speedMultiplier: number };
  };
}

const callExpedition = async <T,>(page: Page, action: string, ...args: unknown[]): Promise<T> =>
  page.evaluate(
    ({ act, fnArgs, poi }) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[poi];
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act](...fnArgs);
    },
    { act: action, fnArgs: args, poi: POI },
  ) as Promise<T>;

const getRun = (page: Page) => callExpedition<RunShape | null>(page, 'getRun');
const getOptions = (page: Page) => callExpedition<string[]>(page, 'getOptions');
const advanceTicks = (page: Page, n: number) =>
  page.evaluate((ticks) => (window as HooksWindow).__idleVillageTestHooks?.advanceTicks?.(ticks), n);
const getClock = (page: Page) =>
  page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getClock?.());

const window_ = (page: Page) => page.getByTestId('quest-window');
const choices = (page: Page) => page.getByTestId('quest-window-choice');
const beatStage = (page: Page) => page.getByTestId('quest-window-beat');
const checkColumn = (page: Page) => page.getByTestId('quest-check-column');

const waitForHooks = (page: Page) =>
  page.waitForFunction(
    (pid) => Boolean((window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid]),
    POI,
    { timeout: 30_000 },
  );

const launchQuest = async (page: Page) => {
  await callExpedition(page, 'demoLaunch');
  await expect(window_(page)).toBeVisible({ timeout: 30_000 });
};

/** Park on a waiting frontier: mature pending nodes on the clock, flush beats. */
const reachWaitingFrontier = async (page: Page, maxSteps = 40) => {
  for (let i = 0; i < maxSteps; i++) {
    const run = await getRun(page);
    if (!run || run.ended) throw new Error(`run ended before a waiting frontier (${run?.nodeId})`);
    if (run.frontier.status === 'pending') {
      const clock = await getClock(page);
      const lead = Math.max(0, run.frontier.readyAt - (clock?.currentTick ?? 0));
      await advanceTicks(page, lead + 1);
    }
    for (let j = 0; j < 20; j++) {
      if (await choices(page).first().isVisible().catch(() => false)) break;
      if (await checkColumn(page).isVisible().catch(() => false)) {
        const board = page.getByTestId('quest-check-board');
        const verdict = page.getByTestId('quest-verdict-card');
        const tira = checkColumn(page).locator('.da-tira, #launch');
        for (let k = 0; k < 40 && !(await verdict.isVisible().catch(() => false)); k++) {
          if (await tira.isVisible().catch(() => false)) await tira.click().catch(() => undefined);
          await page.waitForTimeout(250);
          await board.click().catch(() => undefined);
          await page.waitForTimeout(350);
        }
        await page.waitForTimeout(500);
        await checkColumn(page).click({ position: { x: 8, y: 8 } });
        await expect(checkColumn(page)).toBeHidden({ timeout: 10_000 });
        continue;
      }
      if (await beatStage(page).isVisible().catch(() => false)) {
        await beatStage(page).click({ force: true, timeout: 1_500 }).catch(() => undefined);
      }
      await page.waitForTimeout(120);
    }
    const options = await getOptions(page);
    if (run.frontier.status === 'waiting' && options.length) return;
    if (!options.length) await advanceTicks(page, 10);
  }
  throw new Error('never reached a waiting frontier');
};

test.describe('PLAN-060 — quest window input coordination', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/game');
    await waitForHooks(page);
  });

  // INV:input-1 — pending selection owns the keys: `1` picks the option and
  // leaves the speed multiplier untouched (the reported #2 bug).
  test('key press selects the pending option and does not change speed', async ({ page }) => {
    await launchQuest(page);
    await reachWaitingFrontier(page);

    /* Find the first ENABLED choice — disabled options (locked/gated) cannot
     * be picked and legitimately fall through to the speed binding. */
    const enabledIndex = await choices(page).evaluateAll(
      (els) => els.findIndex((el) => !(el as HTMLButtonElement).disabled),
    );
    test.skip(enabledIndex < 0, 'no enabled option at this frontier');
    test.skip(enabledIndex > 8, 'enabled option beyond the 1-9 range');

    const before = await getRun(page);
    const speedBefore = (await getClock(page))?.speedMultiplier;

    await page.keyboard.press(String(enabledIndex + 1));

    /* The choice is consumed: beats start presenting or the frontier moves. */
    await expect
      .poll(async () => {
        const run = await getRun(page);
        const beat = await beatStage(page).isVisible().catch(() => false);
        const col = await checkColumn(page).isVisible().catch(() => false);
        return `${run?.nodeId}|${run?.frontier.status}|beat:${beat}|col:${col}`;
      })
      .not.toBe(`${before?.nodeId}|${before?.frontier.status}|beat:false|col:false`);

    expect((await getClock(page))?.speedMultiplier).toBe(speedBefore);
  });

  // INV:input-2 — no pending selection (locked frontier: options rendered but
  // all disabled, nowTick < readyAt): the speed binding still works — the
  // ruled policy "speed only when no selection pending".
  test('locked frontier leaves the speed binding live', async ({ page }) => {
    await launchQuest(page);
    await reachWaitingFrontier(page);
    /* Freeze the clock: a paused game never syncs ticks, so the frontier the
     * next commit lands on stays locked (nowTick < readyAt) for as long as
     * we need — the state is deterministic, not a race. Blur first: the
     * frame handler ignores keys targeted at BUTTONs. */
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    for (let i = 0; i < 3; i++) {
      if ((await getClock(page))?.isPaused) break;
      await page.keyboard.press('Space');
      await page.waitForTimeout(200);
    }
    await expect.poll(async () => (await getClock(page))?.isPaused, { timeout: 5_000 }).toBe(true);

    /* Commit on the real `choose` path — the party marches to the next node
     * whose waiting frontier stays locked while the game is paused. */
    const options = await getOptions(page);
    const before = await getRun(page);
    await callExpedition(page, 'choose', options[0]);

    /* Flush the presentation (beats are wall-clock, they still play while
     * the quest clock is paused) until the window is quiet — no beat, no
     * check column, and either a pending node or all choices disabled. */
    const deadline = Date.now() + 30_000;
    for (;;) {
      const run = await getRun(page);
      if (!run || run.ended) {
        test.skip(true, `commit ended the run (${run?.outcome ?? 'null'}) — no locked frontier to probe`);
        return;
      }
      if (run.nodeId !== before?.nodeId) break;
      if (Date.now() > deadline) throw new Error('commit never left the frontier');
      if (await beatStage(page).isVisible().catch(() => false)) {
        await beatStage(page).click({ force: true }).catch(() => undefined);
      }
      await page.waitForTimeout(120);
    }
    for (;;) {
      if (Date.now() > deadline) throw new Error('presentation never settled to a quiet locked state');
      if (await beatStage(page).isVisible().catch(() => false)) {
        await beatStage(page).click({ force: true }).catch(() => undefined);
        await page.waitForTimeout(120);
        continue;
      }
      if (await checkColumn(page).isVisible().catch(() => false)) {
        const board = page.getByTestId('quest-check-board');
        const verdict = page.getByTestId('quest-verdict-card');
        const tira = checkColumn(page).locator('.da-tira, #launch');
        for (let k = 0; k < 40 && !(await verdict.isVisible().catch(() => false)); k++) {
          if (await tira.isVisible().catch(() => false)) await tira.click().catch(() => undefined);
          await page.waitForTimeout(250);
          await board.click().catch(() => undefined);
          await page.waitForTimeout(350);
        }
        await page.waitForTimeout(500);
        await checkColumn(page).click({ position: { x: 8, y: 8 } }).catch(() => undefined);
        continue;
      }
      const run = await getRun(page);
      const enabled = await choices(page)
        .evaluateAll((els) => els.some((el) => !(el as HTMLButtonElement).disabled))
        .catch(() => false);
      if (run && !run.ended && (run.frontier.status === 'pending' || !enabled)) break;
      await page.waitForTimeout(120);
    }

    /* Quiet locked state reached — no selection is pending, so the digit
     * must drive the speed binding (Director ruling). `onSpeedChange` also
     * resumes the game — that's the speed key doing its job, not a stray
     * selection: the node and the run must be untouched. */
    const speedBefore = (await getClock(page))?.speedMultiplier ?? 1;
    const key = speedBefore >= 4 ? '2' : '3';
    const expected = speedBefore >= 4 ? 2 : 4;
    const lockedRun = await getRun(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    await page.keyboard.press(key);
    await expect.poll(async () => (await getClock(page))?.speedMultiplier).toBe(expected);
    const after = await getRun(page);
    expect(after?.nodeId).toBe(lockedRun?.nodeId);
    expect(after?.ended).toBe(false);
  });

  // INV:input-3 — frontier verify (the #1 complaint): readyAt maturation
  // unlocks the option and a real click advances the phase.
  test('frontier matures at readyAt and an enabled option advances the phase', async ({ page }) => {
    await launchQuest(page);
    const pending = await getRun(page);
    expect(pending, 'run must exist').toBeTruthy();

    if (pending!.frontier.status === 'pending') {
      const clock = await getClock(page);
      const lead = Math.max(0, pending!.frontier.readyAt - (clock?.currentTick ?? 0));
      await advanceTicks(page, lead + 1);
    }

    await expect.poll(async () => (await getRun(page))?.frontier.status).toBe('waiting');
    await expect(choices(page).first()).toBeVisible();

    const enabled = choices(page).locator(':not([disabled])').first();
    await expect(enabled).toBeVisible();
    const before = await getRun(page);
    await enabled.click();

    await expect
      .poll(async () => {
        const run = await getRun(page);
        return `${run?.nodeId}|${run?.frontier.status}|${run?.ended}`;
      })
      .not.toBe(`${before?.nodeId}|${before?.frontier.status}|${before?.ended}`);
  });

  // INV:input-4 — while a beat is on stage the window owns every key:
  // pressing a digit advances the beat, never the speed.
  test('presenting beat consumes the key without changing speed', async ({ page }) => {
    await launchQuest(page);
    await reachWaitingFrontier(page);
    const options = await getOptions(page);
    await callExpedition(page, 'choose', options[0]);

    /* A beat or the check column must be on stage — else the commit ran to a
     * frontier with no presentation, and this test has nothing to measure. */
    const onStage = await Promise.race([
      beatStage(page).waitFor({ state: 'visible', timeout: 8_000 }).then(() => 'beat'),
      checkColumn(page).waitFor({ state: 'visible', timeout: 8_000 }).then(() => 'check'),
    ]).catch(() => null);
    test.skip(!onStage, 'commit produced no presenting surface');
    if (onStage !== 'beat') return; // check column owns its own keys — out of scope here

    const speedBefore = (await getClock(page))?.speedMultiplier;
    await page.keyboard.press('3');
    await page.waitForTimeout(150);
    expect((await getClock(page))?.speedMultiplier).toBe(speedBefore);
  });
});
