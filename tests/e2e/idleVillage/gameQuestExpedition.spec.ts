/**
 * gameQuestExpedition.spec.ts — PLAN-019-S2.4 T-5: the REAL quest POI flow on
 * `/game`: planning surface → roster → slot assignment → dynamic forecast →
 * «Invia spedizione» → canonical `QuestRunWindow`, with the D-J/D-K clock
 * contract (halo = elapsed/live-duration, catch-up consumes matured nodes).
 *
 * Resident fixtures are the canonical `TEST_ROSTER_HEROES` the store seeds:
 * - `hero-sir-spaccaculi` (fortitude/warden) → valid for the goblin leader slot
 * - `hero-giggiolillo`    (edge/precision)   → valid for member/bodyguard
 * - `hero-salvatrice`     (ward/clarity)     → INVALID for every goblin slot
 */
import { test, expect, type Page } from '@playwright/test';
import { dragResidentPointer } from '../../utils/dragResident';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const VALID_MEMBER = 'hero-giggiolillo';
const INVALID_RESIDENT = 'hero-salvatrice';

type RunShape = {
  ended: boolean;
  nodeId: string;
  visitedNodes: string[];
  party: { id: string }[];
  frontier: { status: string; readyAt: number };
};
type HaloShape = { fraction: number; elapsedTicks: number; durationTicks: number; status: string };
type ExpeditionHook = {
  getAssignments?: () => Record<string, string | null>;
  getRun?: () => RunShape | null;
  getHalo?: () => HaloShape | null;
};

/* The hooks live in the browser — `evaluate` is the boundary. Small named
 *  helpers keep each call a single, readable action instead of shipping
 *  closures across it. */
interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, ExpeditionHook & Record<string, unknown>>;
    advanceTicks?: (n: number) => void;
  };
}

const callExpedition = async <T,>(page: Page, action: string, ...args: unknown[]): Promise<T> => {
  const result = await page.evaluate(
    ({ poiId, act, fnArgs }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId] as
        | Record<string, (...a: unknown[]) => unknown>
        | undefined;
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act](...fnArgs);
    },
    { poiId: POI, act: action, fnArgs: args },
  );
  return result as T;
};

const expedition = <T,>(page: Page, action: string, ...args: unknown[]) => callExpedition<T>(page, action, ...args);

const advanceTicks = (page: Page, n: number) =>
  page.evaluate((ticks) => {
    (window as TestHooksWindow).__idleVillageTestHooks?.advanceTicks?.(ticks);
  }, n);

const getRun = (page: Page) => expedition<RunShape | null>(page, 'getRun');

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  // Wait for the expedition session + hooks to be live (canvas/map may lag).
  await page.waitForFunction(
    (poiId) =>
      Boolean(
        (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId],
      ),
    POI,
    { timeout: 30_000 },
  );
});

test.describe('PLAN-019-S2.4 — real quest POI on /game', () => {
  test('POI is present with an empty halo before launch (D-J)', async ({ page }) => {
    // questStatus=available → the seal shows no fill (halo empty until «Invia»).
    const halo = await expedition<HaloShape | null>(page, 'getHalo');
    expect(halo).toBeNull(); // no run → no halo progress at all
    const marker = page.locator('[data-map-quest-poi-target][data-quest-status="available"]').first();
    await expect(marker).toBeVisible({ timeout: 15_000 });
  });

  test('planning surface opens, gates «Invia spedizione» on required slots, rejects an ineligible resident', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();

    // Required slots empty → send disabled, forecast in the «incomplete» state.
    const send = page.getByTestId('quest-expedition-send');
    await expect(send).toBeDisabled();
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'incomplete');

    // Salvatrice fails the leader requirement (edge|fortitude) — the same
    // verdict a real drop would get, and the hook refuses the assignment.
    const verdict = await expedition<{ eligible: boolean }>(page, 'checkEligibility', SLOT_LEADER, INVALID_RESIDENT);
    expect(verdict.eligible).toBe(false);
    const assigned = await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, INVALID_RESIDENT);
    expect(assigned).toBe(false);
    const assignments = await expedition<Record<string, string | null>>(page, 'getAssignments');
    expect(assignments[SLOT_LEADER] ?? null).toBeNull();
    // Still gated — an invalid drop cannot sneak a launch through.
    await expect(send).toBeDisabled();
  });

  test('real drag assigns a valid resident to the leader slot', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();

    const card = page.locator(`[data-worker-id="${VALID_LEADER}"]`).first();
    const slot = page.locator(`[data-slot-id="${SLOT_LEADER}"]`).first();
    await expect(card).toBeVisible();
    await expect(slot).toBeVisible();

    await dragResidentPointer(page, card, slot, { stepDelayMs: 30 });
    await page.waitForTimeout(600); // flight lands, then the assignment commits
    await page.waitForFunction(
      (slotId) => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
        return exp?.getAssignments?.()[slotId] === 'hero-sir-spaccaculi';
      },
      SLOT_LEADER,
      { timeout: 8_000 },
    );
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled();
  });

  test('forecast computes on the real party and «Invia» freezes one run into the quest window', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, VALID_MEMBER);

    // The chunked Monte Carlo lands (never partial: incomplete → ready).
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready', {
      timeout: 20_000,
    });
    const estimate = await expedition<{ sim: { outcomePct: { reward: number } } } | 'incomplete' | null>(page, 'getEstimate');
    expect(estimate).not.toBeNull();
    expect(estimate).not.toBe('incomplete');
    expect((estimate as { sim: { outcomePct: { reward: number } } }).sim.outcomePct.reward).toBeGreaterThanOrEqual(0);
    expect((estimate as { sim: { outcomePct: { reward: number } } }).sim.outcomePct.reward).toBeLessThanOrEqual(100);

    // Double-commit in the same breath → exactly one run (T-3 latch).
    await expedition<void>(page, 'send');
    await expedition<void>(page, 'send');
    const run = await getRun(page);
    expect(run).not.toBeNull();
    expect(run!.ended).toBe(false);
    expect(run!.party.map((m) => m.id).sort()).toEqual([VALID_MEMBER, VALID_LEADER].sort());

    // The canonical run window opens on the active quest.
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });

    // And the launch refroze the offer into the run — the detail is gone.
    await expect(page.getByTestId('quest-expedition-detail')).toHaveCount(0);
  });

  test('halo tracks elapsed ticks — including while a decision is waiting (D-J)', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 15_000 });
    await expedition<void>(page, 'send');
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });

    const t0 = (await getRun(page))!;
    expect(t0.frontier).toBeDefined();

    await advanceTicks(page, 25);
    await page.waitForFunction(
      () => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
        return (exp?.getHalo?.()?.elapsedTicks ?? 0) >= 25;
      },
      undefined,
      { timeout: 8_000 },
    );
    const halo = (await expedition<HaloShape | null>(page, 'getHalo'))!;
    expect(halo.elapsedTicks).toBeGreaterThanOrEqual(25);
    expect(halo.fraction).toBeGreaterThan(0);
    // 250-tick estimate on goblin → still filling, not clamped.
    expect(halo.status).toBe('filling');

    // The halo keeps writing while the run sits on an unresolved decision:
    // elapsed time is the player-visible cost of thinking (D-J, no pause).
    const later = await getRun(page);
    if (later!.frontier.status === 'waiting') {
      await advanceTicks(page, 20);
      const halo2 = (await expedition<HaloShape | null>(page, 'getHalo'))!;
      expect(halo2.elapsedTicks).toBeGreaterThanOrEqual(45);
    }
  });

  test('decisions never auto-resolve across a tick jump; the player resolves them in order (D-K)', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 15_000 });
    await expedition<void>(page, 'send');
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });

    const before = (await getRun(page))!;
    expect(before.nodeId).toBe('gob-inizio');
    expect(before.frontier.status).toBe('waiting');

    /* 30 ticks pass with a decision open: offline time fills the halo (D-J)
     *  but must NEVER decide for the player — the frontier is still
     *  `gob-inizio`, still waiting. (Timed-beat chain maturation is the
     *  engine's `matureReady` — unit-covered; the early goblin graph is
     *  decision-first, so no pending beat is reachable this shallow.) */
    await advanceTicks(page, 30);
    await page.waitForFunction(
      () => ((window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin']?.getHalo?.()?.elapsedTicks ?? 0) >= 30,
      undefined,
      { timeout: 8_000 },
    );
    const after = (await getRun(page))!;
    expect(after.nodeId).toBe('gob-inizio');
    expect(after.frontier.status).toBe('waiting');

    // The decision is presented to the player as a real choice button…
    // (the window may still be typewriter-presenting the launch beat —
    //  choices appear when the presentation finishes).
    const choices = page.locator('[data-hud-choices] button');
    await expect(choices.first()).toBeVisible({ timeout: 20_000 });
    const options = await expedition<string[]>(page, 'getOptions');
    expect(options).toContain('gob-partenza');

    // …and the player resolves it (the same api the button calls) — the run
    // advances to the next node.
    await expedition<void>(page, 'choose', 'gob-partenza');
    await page.waitForFunction(
      () => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
        return exp?.getRun?.()?.nodeId === 'gob-esplora';
      },
      undefined,
      { timeout: 8_000 },
    );
    const next = (await getRun(page))!;
    expect(next.nodeId).toBe('gob-esplora');
    // The phase strip renders the played beats (and the next as preview).
    const beats = page.locator('[data-testid="quest-window-beat"]');
    await expect(beats.first()).toBeVisible();
    expect(await beats.count()).toBeGreaterThanOrEqual(1);
  });

  test('an active run survives reload and keeps its halo clock (PersistenceService)', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 15_000 });
    await expedition<void>(page, 'send');
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });
    const launched = (await getRun(page))!;
    await advanceTicks(page, 12);
    // The canonical tick schedules the state save — give it room to land.
    await page.waitForTimeout(800);

    await page.reload();
    await page.waitForFunction(
      () =>
        Boolean(
          (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin']?.getRun?.(),
        ),
      undefined,
      { timeout: 30_000 },
    );
    const restored = (await getRun(page))!;
    expect(restored.nodeId).toBe(launched.nodeId);
    expect(restored.party.map((m) => m.id)).toEqual(launched.party.map((m) => m.id));
    /* /game does not hydrate the gameplay clock on load (declared page
     *  behaviour — the store starts fresh, the RUN is what persists). So the
     *  halo re-opens at elapsed≈0 and resumes filling as canonical ticks
     *  pass — `launchedAtTick` stays frozen in the run save. */
    const halo = (await expedition<HaloShape | null>(page, 'getHalo'))!;
    expect(halo.status).toBe('filling');
    await advanceTicks(page, 15);
    const halo2 = (await expedition<HaloShape | null>(page, 'getHalo'))!;
    expect(halo2.elapsedTicks).toBeGreaterThanOrEqual(15);
    // questStatus=in_progress → the POI routes to the run window, not the detail.
    const marker = page.locator('[data-map-quest-poi-target][data-quest-status="in_progress"]').first();
    await expect(marker).toBeVisible({ timeout: 15_000 });
  });
});
