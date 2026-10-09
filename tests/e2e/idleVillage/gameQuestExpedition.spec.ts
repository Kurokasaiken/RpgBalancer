/**
 * gameQuestExpedition.spec.ts — PLAN-019-S2.4 T-5: the REAL quest POI flow on
 * `/game`: planning surface → roster → slot assignment → dynamic forecast →
 * «Invia spedizione» → canonical `QuestRunWindow`, with the D-J/D-K clock
 * contract (halo = elapsed/live-duration, catch-up consumes matured nodes).
 *
 * Resident fixtures are the canonical `TEST_ROSTER_HEROES` the store seeds:
 * - `hero-sir-spaccaculi` (fortitude/warden) → valid for leader/member-1/bodyguard
 * - `hero-giggiolillo`    (edge/precision)   → valid for leader/member-1/member-2
 * - `hero-salvatrice`     (ward/clarity)     → valid ONLY for member-2
 *   (esploratore: clarity|precision); leader/member-1/bodyguard reject her.
 */
import { test, expect, type Page } from '@playwright/test';
import { dragResidentPointer } from '../../utils/dragResident';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const SLOT_MEMBER_2 = `${POI}:goblin-slot-member-2`;
const POI_ROVINE = 'poi-rovine';
const SLOT_ROVINE_LEADER = `${POI_ROVINE}:rovine-slot-leader`;
const SLOT_ROVINE_ESPLORATORE = `${POI_ROVINE}:rovine-slot-esploratore`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const VALID_MEMBER = 'hero-giggiolillo';
const INVALID_RESIDENT = 'hero-salvatrice';
/** Rovine leader gate = fortitude|edge → giggiolillo (edge); the esploratore
 *  slot takes clarity|precision → salvatrice (clarity). */

type RunShape = {
  ended: boolean;
  nodeId: string;
  visitedNodes: string[];
  outcome?: string;
  gold?: number;
  xp?: number;
  party: { id: string; dead?: boolean; wounded?: boolean; role?: string }[];
  frontier: { status: string; readyAt: number };
  settlement?: SettlementShape | null;
  scenarioInstanceId?: string;
  resolvedOffer?: { rewardResolved?: number } | null;
};
type HaloShape = { fraction: number; elapsedTicks: number; durationTicks: number; status: string };
type SettlementShape = { status: 'settling' | 'settled'; atTick: number; plan: { runId: string; outcome: string } };
type VillageShape = {
  gold: number;
  xp: number;
  residents: { id: string; isDead: boolean; isInjured: boolean; injuredUntilTick: number | null }[];
};
type ExpeditionHook = {
  getAssignments?: () => Record<string, string | null>;
  getRun?: () => RunShape | null;
  getHalo?: () => HaloShape | null;
  getSettlement?: () => SettlementShape | null;
  getVillage?: () => VillageShape;
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

const callExpedition = async <T,>(page: Page, poiId: string, action: string, ...args: unknown[]): Promise<T> => {
  const result = await page.evaluate(
    ({ poiId, act, fnArgs }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId] as
        | Record<string, (...a: unknown[]) => unknown>
        | undefined;
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act](...fnArgs);
    },
    { poiId, act: action, fnArgs: args },
  );
  return result as T;
};

const expedition = <T,>(page: Page, action: string, ...args: unknown[]) => callExpedition<T>(page, POI, action, ...args);
const expeditionFor = <T,>(page: Page, poiId: string, action: string, ...args: unknown[]) =>
  callExpedition<T>(page, poiId, action, ...args);

const advanceTicks = (page: Page, n: number) =>
  page.evaluate((ticks) => {
    (window as TestHooksWindow).__idleVillageTestHooks?.advanceTicks?.(ticks);
  }, n);

const getRun = (page: Page) => expedition<RunShape | null>(page, 'getRun');

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  // Wait for the expedition sessions + hooks to be live (canvas/map may lag).
  await page.waitForFunction(
    ([goblin, rovine]) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[goblin]) && Boolean(exp?.[rovine]);
    },
    [POI, POI_ROVINE],
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

    /* Parity forecast↔run: the run must freeze THE offer the surface showed
     *  — same resolved record, same content-addressed instance. */
    const shownOffer = await expedition<{ instanceId: string }>(page, 'getResolvedOffer');
    expect(shownOffer).not.toBeNull();

    // Double-commit in the same breath → exactly one run (T-3 latch).
    await expedition<void>(page, 'send');
    await expedition<void>(page, 'send');
    const run = await getRun(page);
    expect(run).not.toBeNull();
    expect(run!.ended).toBe(false);
    expect(run!.party.map((m) => m.id).sort()).toEqual([VALID_MEMBER, VALID_LEADER].sort());
    expect(run!.scenarioInstanceId).toBe(shownOffer.instanceId);
    expect(JSON.stringify(run!.resolvedOffer)).toBe(JSON.stringify(shownOffer));

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

  test('forecast is party-dependent and the roster marks the ineligible card', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();

    /* While the detail plans, each roster card carries the compatibility
     *  verdict — `data-compatibility` on the real PgCard, not a parallel
     *  marker. Both heroes start 'valid': spaccaculi for leader, salvatrice
     *  for member-2/esploratore (clarity) — her only accepting slot. */
    const salvatrice = page.locator(`[data-worker-id="${INVALID_RESIDENT}"]`).first();
    const leaderCard = page.locator(`[data-worker-id="${VALID_LEADER}"]`).first();
    await expect(salvatrice).toHaveAttribute('data-compatibility', 'valid');
    await expect(leaderCard).toHaveAttribute('data-compatibility', 'valid');

    // Solo leader → one estimate.
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready', {
      timeout: 20_000,
    });
    const soloJson = await expedition<string>(page, 'getEstimateJson');

    /* Adding a member re-runs the sim: the estimate is a different object
     *  with different numbers (party-dependent, not a static label).
     *  member-2 is the esploratore slot — filling it also leaves salvatrice
     *  with no accepting slot, so her card flips to 'invalid'. */
    await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER_2, VALID_MEMBER);
    await page.waitForFunction(
      (previous) => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'] as
          | { getEstimateJson?: () => string }
          | undefined;
        const current = exp?.getEstimateJson?.();
        return typeof current === 'string' && current !== previous;
      },
      soloJson,
      { timeout: 20_000 },
    );
    const duoJson = await expedition<string>(page, 'getEstimateJson');
    expect(duoJson).not.toBe(soloJson);
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready');
    await expect(salvatrice).toHaveAttribute('data-compatibility', 'invalid');
  });

  test('a long absence fills the halo past the estimate but never concludes a waiting frontier (catch-up + badge)', async ({ page }) => {
    await expedition<void>(page, 'openDetail');
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 15_000 });
    await expedition<void>(page, 'send');
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });

    /* One jump past the whole 250-tick estimate: catch-up matures what can
     *  mature, the halo caps at full, and the run sits `pieno-in-attesa`
     *  on the first unresolved decision — time passed, nothing decided. */
    await advanceTicks(page, 300);
    await page.waitForFunction(
      () => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
        return (exp?.getHalo?.()?.elapsedTicks ?? 0) >= 300;
      },
      undefined,
      { timeout: 10_000 },
    );
    const halo = (await expedition<HaloShape | null>(page, 'getHalo'))!;
    expect(halo.status).toBe('pieno-in-attesa');
    const run = (await getRun(page))!;
    expect(run.nodeId).toBe('gob-inizio');
    expect(run.frontier.status).toBe('waiting');
    expect(run.ended).toBe(false);

    // And the map says so: the POI badge marks the awaiting decision.
    const badge = page.locator('[data-map-quest-poi-target] [data-decision-waiting="true"]').first();
    await expect(badge).toBeVisible({ timeout: 15_000 });
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
    /* /game hydrates the gameplay clock on load (Director decision
     *  2026-10-10): `currentTick` is restored from the same snapshot epoch
     *  the run's `launchedAtTick` was stamped in, so the halo resumes with
     *  its elapsed ticks preserved. Store hydration is async — poll until
     *  the projected elapsed catches up (the live 1s loop also adds ticks). */
    await page.waitForFunction(
      () =>
        ((window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin']?.getHalo?.()
          ?.elapsedTicks ?? 0) >= 12,
      undefined,
      { timeout: 30_000 },
    );
    const halo = (await expedition<HaloShape | null>(page, 'getHalo'))!;
    expect(halo.status).toBe('filling');
    await advanceTicks(page, 15);
    const halo2 = (await expedition<HaloShape | null>(page, 'getHalo'))!;
    expect(halo2.elapsedTicks).toBeGreaterThanOrEqual(halo.elapsedTicks + 15);
    // questStatus=in_progress → the POI routes to the run window, not the detail.
    const marker = page.locator('[data-map-quest-poi-target][data-quest-status="in_progress"]').first();
    await expect(marker).toBeVisible({ timeout: 15_000 });
  });
});

/* ------------------------------------------------------------------ */
/* PLAN-019-S2.5 — settlement + sequential POIs                        */
/* ------------------------------------------------------------------ */

/** Drives a live run to its terminal frontier: resolves waiting decisions
 *  (first option; rotates on a stuck node to escape push-your-luck loops)
 *  and matures pending timed nodes on the canonical clock. `flee` is never
 *  an option id — retreat lives outside `availableOptions`. */
async function driveRunToEnd(page: Page, poiId: string, maxSteps = 120): Promise<RunShape> {
  let lastNode = '';
  let repeats = 0;
  for (let i = 0; i < maxSteps; i++) {
    const run = await expeditionFor<RunShape | null>(page, poiId, 'getRun');
    if (!run) throw new Error(`[${poiId}] run vanished mid-drive`);
    if (run.ended) return run;
    if (run.frontier.status === 'waiting') {
      const options = await expeditionFor<string[]>(page, poiId, 'getOptions');
      if (!options.length) throw new Error(`[${poiId}] waiting frontier without options at ${run.nodeId}`);
      repeats = run.nodeId === lastNode ? repeats + 1 : 0;
      lastNode = run.nodeId;
      await expeditionFor<void>(page, poiId, 'choose', options[Math.min(repeats, options.length - 1)]);
    } else {
      await advanceTicks(page, 15);
      await page.waitForFunction(
        ({ pid, node, fv }) => {
          const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
            | { getRun?: () => RunShape | null }
            | undefined;
          const r = exp?.getRun?.();
          return !r || r.ended || r.nodeId !== node || r.frontier.status !== 'pending' || r.frontier.readyAt !== fv;
        },
        { pid: poiId, node: run.nodeId, fv: run.frontier.readyAt },
        { timeout: 8_000 },
      ).catch(() => undefined); // timed out mid-beat — next loop re-reads the run
    }
  }
  throw new Error(`[${poiId}] run did not terminate in ${maxSteps} steps`);
}

test.describe('PLAN-019-S2.5 — settlement + sequential POIs', () => {
  test('terminal run settles once: consequences as data, party released, POI2 gated until settle', async ({ page }) => {
    /* --- POI 1 lifecycle: offer → assign → launch. Goblin leader-only so
     *  giggiolillo (edge) stays free for the rovine leader gate. */
    const villageBefore = await expedition<VillageShape>(page, 'getVillage');
    await expedition<void>(page, 'openDetail');
    await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-send')).toBeEnabled({ timeout: 15_000 });
    await expedition<void>(page, 'send');
    await expect(page.getByTestId('quest-window')).toBeVisible({ timeout: 10_000 });

    /* --- Sequential gate: while the goblin run is live (or ended but not
     *  yet settled), the rovine detail can open and assign, but «Invia»
     *  stays gated — one expedition out at a time (T-5 ordering). */
    await expeditionFor<void>(page, POI_ROVINE, 'openDetail');
    await expeditionFor<boolean>(page, POI_ROVINE, 'assignToSlot', SLOT_ROVINE_LEADER, VALID_MEMBER);
    const lockedOut = await expeditionFor<{ eligible: boolean; reason?: string }>(
      page,
      POI_ROVINE,
      'checkEligibility',
      SLOT_ROVINE_LEADER,
      VALID_LEADER,
    );
    expect(lockedOut.eligible).toBe(false);
    expect(lockedOut.reason).toBe('in-expedition');
    const rovineSend = page.getByTestId('quest-expedition-send');
    await expect(rovineSend).toBeDisabled();

    /* --- Terminal: drive the run to its end, then settlement lands. */
    const terminal = await driveRunToEnd(page, POI);
    expect(terminal.ended).toBe(true);
    expect(['reward', 'survived', 'fled', 'wipe']).toContain(terminal.outcome);

    await page.waitForFunction(
      (pid) => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
          | { getSettlement?: () => SettlementShape | null }
          | undefined;
        return exp?.getSettlement?.()?.status === 'settled';
      },
      POI,
      { timeout: 15_000 },
    );
    const settlement = await expedition<SettlementShape | null>(page, 'getSettlement');
    expect(settlement?.status).toBe('settled');

    /* --- Consequences as DATA: resident fates in the village aggregate. */
    const villageAfter = await expedition<VillageShape>(page, 'getVillage');
    for (const member of terminal.party) {
      const res = villageAfter.residents.find((r) => r.id === member.id);
      expect(res, `resident ${member.id} in roster`).toBeTruthy();
      if (member.dead) expect(res!.isDead).toBe(true);
      else if (member.wounded) {
        expect(res!.isInjured).toBe(true);
        expect(res!.injuredUntilTick).not.toBeNull();
      }
    }
    /* Fungible delta — exact, never set-to-expected: rewardResolved only on
     *  outcome 'reward'; the run's hoarded gold comes home unless wipe. */
    const expectedGold =
      (terminal.outcome === 'reward' ? terminal.resolvedOffer?.rewardResolved ?? 0 : 0) +
      (terminal.outcome === 'wipe' ? 0 : terminal.gold ?? 0);
    expect(villageAfter.gold - villageBefore.gold).toBe(expectedGold);
    if (terminal.outcome !== 'wipe') {
      expect(villageAfter.xp - villageBefore.xp).toBe(terminal.xp ?? 0);
    }

    /* --- Release: the settled party is assignable again, and POI 2 can
     *  launch only now (T-5 sequential contract). */
    const released = await expeditionFor<{ eligible: boolean }>(
      page,
      POI_ROVINE,
      'checkEligibility',
      SLOT_ROVINE_LEADER,
      VALID_LEADER,
    );
    if (!terminal.party.some((m) => m.id === VALID_LEADER && m.dead)) {
      expect(released.eligible).toBe(true);
    }
    await expect(rovineSend).toBeEnabled({ timeout: 15_000 });

    /* --- POI 2 launches — the second posting's own pipeline (T-4). */
    await expeditionFor<void>(page, POI_ROVINE, 'send');
    const rovineRun = await expeditionFor<RunShape | null>(page, POI_ROVINE, 'getRun');
    expect(rovineRun).not.toBeNull();
    expect(rovineRun!.ended).toBe(false);
    expect(rovineRun!.nodeId.startsWith('rv-')).toBe(true);
    expect(rovineRun!.party.map((m) => m.id)).toEqual([VALID_MEMBER]);
    expect(rovineRun!.scenarioInstanceId).toBeTruthy();

    /* --- Reload mid-run: the rovine frontier survives intact. */
    await advanceTicks(page, 12);
    await page.waitForTimeout(800);
    const beforeReload = (await expeditionFor<RunShape | null>(page, POI_ROVINE, 'getRun'))!;
    await page.reload();
    await page.waitForFunction(
      (pid) =>
        Boolean(
          (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid]?.getRun?.(),
        ),
      POI_ROVINE,
      { timeout: 30_000 },
    );
    const restored = (await expeditionFor<RunShape | null>(page, POI_ROVINE, 'getRun'))!;
    expect(restored.nodeId).toBe(beforeReload.nodeId);
    expect(restored.settlement?.status ?? null).toBeNull();
  });

  test('second POI (rovine): planning → assignment → forecast → launch on its own offer', async ({ page }) => {
    await expeditionFor<void>(page, POI_ROVINE, 'openDetail');
    await expect(page.getByTestId('quest-expedition-detail')).toBeVisible();

    /* Wrong-tag resident rejected by the esploratore gate (clarity|precision):
     *  spaccaculi (fortitude/warden) cannot scout. */
    const verdict = await expeditionFor<{ eligible: boolean }>(
      page,
      POI_ROVINE,
      'checkEligibility',
      SLOT_ROVINE_ESPLORATORE,
      VALID_LEADER,
    );
    expect(verdict.eligible).toBe(false);

    await expeditionFor<boolean>(page, POI_ROVINE, 'assignToSlot', SLOT_ROVINE_LEADER, VALID_MEMBER);
    await expeditionFor<boolean>(page, POI_ROVINE, 'assignToSlot', SLOT_ROVINE_ESPLORATORE, INVALID_RESIDENT);
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready', {
      timeout: 20_000,
    });
    const offer = await expeditionFor<{ instanceId: string }>(page, POI_ROVINE, 'getResolvedOffer');
    expect(offer).not.toBeNull();

    await expeditionFor<void>(page, POI_ROVINE, 'send');
    const run = await expeditionFor<RunShape | null>(page, POI_ROVINE, 'getRun');
    expect(run).not.toBeNull();
    expect(run!.party.map((m) => m.id).sort()).toEqual([VALID_MEMBER, INVALID_RESIDENT].sort());
    expect(run!.nodeId.startsWith('rv-')).toBe(true);

    /* Its halo ticks on the same canonical clock. */
    await advanceTicks(page, 15);
    await page.waitForFunction(
      (pid) => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
          | { getHalo?: () => HaloShape | null }
          | undefined;
        return (exp?.getHalo?.()?.elapsedTicks ?? 0) >= 15;
      },
      POI_ROVINE,
      { timeout: 8_000 },
    );
    const halo = await expeditionFor<HaloShape | null>(page, POI_ROVINE, 'getHalo');
    expect(halo!.status).toBe('filling');
  });
});
