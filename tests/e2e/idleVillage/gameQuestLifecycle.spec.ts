/**
 * gameQuestLifecycle.spec.ts — R-119: the COMPLETE lifecycle of the quest
 * «Sterminio dei goblin» on the canonical `/game` surface, validated piece
 * by piece:
 *
 *   map + roster boot → click the real POI marker → planning → roster
 *   assignment (real drag + hook, same eligibility) → forecast →
 *   «Invia spedizione» → run in the QuestRunWindow → frontiers maturing on
 *   the canonical clock → HUD time controls (pause / resume / ×N, one
 *   driver only) → decisions → terminal outcome → settlement applied once
 *   (rewards + resident fates as data) → party back home → the POI leaves
 *   the map when the report is dismissed and stays gone after reload.
 *
 * Boundaries: `__idleVillageTestHooks.expedition[poiId]` is the inspection/
 * assignment api (same rules as the real UI path — `assignToSlot` refuses
 * what a drop would refuse); the drag is real where it matters.
 */

import { test, expect, type Page } from '@playwright/test';
import { dragResidentPointer } from '../../utils/dragResident';

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const SLOT_MEMBER_2 = `${POI}:goblin-slot-member-2`;
const POI_ROVINE = 'poi-rovine';
const SLOT_ROVINE_LEADER = `${POI_ROVINE}:rovine-slot-leader`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const VALID_MEMBER = 'hero-giggiolillo';
const INVALID_RESIDENT = 'hero-salvatrice';

/* ---------- browser-hook boundary (same shapes as gameQuestExpedition) ---------- */

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
  resolvedOffer?: { rewardResolved?: number } | null;
};
type SettlementShape = {
  status: 'settling' | 'settled';
  atTick: number;
  plan: {
    runId: string;
    questId: string;
    outcome: string;
    leaderAlive: boolean;
    objectiveDone: boolean;
    effects: { key: string; kind: string; residentId?: string; amount?: number }[];
  };
};
type VillageShape = {
  gold: number;
  xp: number;
  residents: { id: string; isDead: boolean; isInjured: boolean; injuredUntilTick: number | null }[];
};
type ClockShape = { currentTick: number; isPaused: boolean; speedMultiplier: number };

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    getClock?: () => ClockShape;
  };
}

const callExpedition = async <T,>(page: Page, poiId: string, action: string, ...args: unknown[]): Promise<T> => {
  const result = await page.evaluate(
    ({ poiId, act, fnArgs }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[poiId];
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing for ${poiId}`);
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

const getClock = (page: Page) =>
  page.evaluate(() => (window as TestHooksWindow).__idleVillageTestHooks?.getClock?.() as ClockShape);

const getRun = (page: Page) => expedition<RunShape | null>(page, 'getRun');

/* ---------- DOM handles ---------- */

const poiMarker = (page: Page) => page.locator(`[data-quest-poi-id="${POI}"]`);
const poiStatus = (page: Page) => poiMarker(page).getAttribute('data-quest-status');
const detail = (page: Page) => page.getByTestId('quest-expedition-detail');
const questWindow = (page: Page) => page.getByTestId('quest-window');
const sendButton = (page: Page) => page.getByTestId('quest-expedition-send');
const closeReportButton = (page: Page) => page.getByTestId('quest-window-close-report');
const speedGroup = (page: Page) => page.locator('[role="radiogroup"]');
const pauseToggle = (page: Page) => speedGroup(page).getByRole('radio').first();
const speedButton = (page: Page, mult: 1 | 2 | 4) => speedGroup(page).getByRole('radio', { name: `×${mult}` });

/** Click the real POI marker on the map — the same path a player takes. */
const openGoblinDetailViaMap = async (page: Page) => {
  await expect(poiMarker(page)).toBeVisible({ timeout: 15_000 });
  await poiMarker(page).click();
  await expect(detail(page)).toBeVisible();
  /* Il titolo dello scenario vive nel chrome del FloatingPanel (header), il
   *  body del detail mostra l'objective «Sterminare il campo dei goblin…». */
  await expect(page.getByTestId('floating-panel-header-quest-expedition-poi-goblin')).toContainText(
    'Sterminio dei goblin',
  );
};

/** Planning → leader assigned → real click on «Invia spedizione». */
const launchGoblinQuest = async (page: Page) => {
  await openGoblinDetailViaMap(page);
  await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
  await expect(sendButton(page)).toBeEnabled({ timeout: 15_000 });
  await sendButton(page).click();
  await expect(questWindow(page)).toBeVisible({ timeout: 10_000 });
};

/**
 * Drive a live run to its terminal frontier: resolves waiting decisions
 * (first option; rotates on a stuck node to escape push-your-luck loops)
 * and matures pending timed nodes on the canonical clock.
 */
async function driveRunToEnd(page: Page, maxSteps = 120): Promise<RunShape> {
  let lastNode = '';
  let repeats = 0;
  for (let i = 0; i < maxSteps; i++) {
    const run = await getRun(page);
    if (!run) throw new Error('run vanished mid-drive');
    if (run.ended) return run;
    if (run.frontier.status === 'waiting') {
      const options = await expedition<string[]>(page, 'getOptions');
      if (!options.length) throw new Error(`waiting frontier without options at ${run.nodeId}`);
      repeats = run.nodeId === lastNode ? repeats + 1 : 0;
      lastNode = run.nodeId;
      await expedition<void>(page, 'choose', options[Math.min(repeats, options.length - 1)]);
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
        { pid: POI, node: run.nodeId, fv: run.frontier.readyAt },
        { timeout: 8_000 },
      ).catch(() => undefined);
    }
  }
  throw new Error(`run did not terminate in ${maxSteps} steps`);
}

/** The first pending (timed) frontier: resolves waiting decisions until the
 *  run sits on a node maturing on the clock. Same rotation as driveRunToEnd. */
async function driveToPending(page: Page, maxSteps = 20): Promise<RunShape> {
  let lastNode = '';
  let repeats = 0;
  for (let i = 0; i < maxSteps; i++) {
    const run = await getRun(page);
    if (!run) throw new Error('run vanished before a pending frontier');
    if (run.ended) throw new Error('run ended before a pending frontier');
    if (run.frontier.status === 'pending') return run;
    if (run.frontier.status === 'waiting') {
      const options = await expedition<string[]>(page, 'getOptions');
      if (!options.length) throw new Error(`waiting frontier without options at ${run.nodeId}`);
      repeats = run.nodeId === lastNode ? repeats + 1 : 0;
      lastNode = run.nodeId;
      await expedition<void>(page, 'choose', options[Math.min(repeats, options.length - 1)]);
      continue;
    }
    await advanceTicks(page, 15);
  }
  throw new Error(`no pending frontier reached in ${maxSteps} steps`);
}

/** Wait until the settlement marker lands `settled` on the run. */
const waitForSettled = (page: Page) =>
  page.waitForFunction(
    (pid) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
        | { getSettlement?: () => SettlementShape | null }
        | undefined;
      return exp?.getSettlement?.()?.status === 'settled';
    },
    POI,
    { timeout: 15_000 },
  );

/**
 * Flush the beat theatre: committed beats replay in the window (click /
 * Enter skips one beat each) and the «Chiudi» report affordance only shows
 * once the queue is empty. Presses Enter until the report surfaces.
 */
const flushBeatTheatre = async (page: Page) => {
  for (let i = 0; i < 240; i++) {
    if (await closeReportButton(page).isVisible()) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  throw new Error('beat theatre never reached the expedition report');
};

const waitForHooks = async (page: Page) =>
  page.waitForFunction(
    ([goblin, rovine]) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[goblin]) && Boolean(exp?.[rovine]);
    },
    [POI, POI_ROVINE],
    { timeout: 30_000 },
  );

/* ================= tests ================= */

test.describe('R-119 — ciclo di vita «Sterminio dei goblin» su /game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game');
    await waitForHooks(page);
  });

  test('boot: roster seedato e marker del POI goblin «available» sulla mappa', async ({ page }) => {
    await expect(page.locator(`[data-worker-id="${VALID_LEADER}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${VALID_MEMBER}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${INVALID_RESIDENT}"]`).first()).toBeVisible();
    await expect(poiMarker(page)).toBeVisible({ timeout: 15_000 });
    expect(await poiStatus(page)).toBe('available');
  });

  test('planning: click sul marker apre il detail; «Invia» gated sugli slot required; residente non eleggibile rifiutata', async ({
    page,
  }) => {
    await expect(detail(page)).toHaveCount(0);
    await openGoblinDetailViaMap(page);

    await expect(sendButton(page)).toBeDisabled();
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'incomplete');
    const assignments = await expedition<Record<string, string | null>>(page, 'getAssignments');
    expect(assignments[SLOT_LEADER] ?? null).toBeNull();
    expect(assignments[SLOT_MEMBER] ?? null).toBeNull();

    /* salvatrice (ward/clarity) fallisce il gate leader (edge|fortitude) —
     *  stesso verdetto di un drop reale, e l'hook rifiuta l'assegnazione. */
    const verdict = await expedition<{ eligible: boolean }>(page, 'checkEligibility', SLOT_LEADER, INVALID_RESIDENT);
    expect(verdict.eligible).toBe(false);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, INVALID_RESIDENT)).toBe(false);
    /* Con member-2 (esploratore, clarity|precision — il suo unico slot)
     *  occupata, salvatrice non ha più uno slot che la accetta: la card
     *  del roster la marca 'invalid'. */
    await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER_2, VALID_MEMBER);
    await expect(page.locator(`[data-worker-id="${INVALID_RESIDENT}"]`).first()).toHaveAttribute(
      'data-compatibility',
      'invalid',
    );
  });

  test('planning: drag reale dal roster assegna il leader e il forecast diventa ready', async ({ page }) => {
    await openGoblinDetailViaMap(page);
    const leaderCard = page.locator(`[data-worker-id="${VALID_LEADER}"]`).first();
    const leaderSlot = page.locator(`[data-slot-id="${SLOT_LEADER}"]`).first();
    await dragResidentPointer(page, leaderCard, leaderSlot);

    const assignments = await expedition<Record<string, string | null>>(page, 'getAssignments');
    expect(assignments[SLOT_LEADER]).toBe(VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready', {
      timeout: 20_000,
    });
    await expect(sendButton(page)).toBeEnabled();
    expect(await expedition<object | null>(page, 'getEstimate')).not.toBeNull();
  });

  test('clock: pausa ferma il tick, ripresa lo riavvia, un solo driver a ×1', async ({ page }) => {
    const c0 = await getClock(page);
    expect(c0.isPaused).toBe(false);
    expect(c0.speedMultiplier).toBe(1);

    await pauseToggle(page).click();
    await expect(pauseToggle(page)).toHaveAttribute('aria-checked', 'true');
    const paused = await getClock(page);
    expect(paused.isPaused).toBe(true);
    await page.waitForTimeout(2200);
    expect((await getClock(page)).currentTick).toBe(paused.currentTick);

    await speedButton(page, 1).click();
    await expect(speedButton(page, 1)).toHaveAttribute('aria-checked', 'true');
    const resumed = await getClock(page);
    expect(resumed.isPaused).toBe(false);
    await page.waitForTimeout(2200);
    const after = await getClock(page);
    expect(after.currentTick).toBeGreaterThan(resumed.currentTick);
    /* Un solo driver alimenta il clock: a ×1 non più di ~1 tick/s. */
    expect(after.currentTick - resumed.currentTick).toBeLessThanOrEqual(3);
  });

  test('clock: ×4 accelera il tick rispetto a ×1', async ({ page }) => {
    await speedButton(page, 1).click();
    const t1 = (await getClock(page)).currentTick;
    await page.waitForTimeout(2500);
    const delta1 = (await getClock(page)).currentTick - t1;

    await speedButton(page, 4).click();
    const t4 = (await getClock(page)).currentTick;
    await page.waitForTimeout(2500);
    const delta4 = (await getClock(page)).currentTick - t4;

    expect(delta4).toBeGreaterThanOrEqual(delta1 * 2);
  });

  test('lancio: «Invia spedizione» apre la QuestRunWindow; POI in_progress e leader «in-expedition»', async ({ page }) => {
    await launchGoblinQuest(page);
    await expect(detail(page)).toHaveCount(0);
    await expect(questWindow(page)).toBeVisible();
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('in_progress');

    const run = (await getRun(page))!;
    expect(run.nodeId).toBe('gob-inizio');
    expect(run.party.map((m) => m.id)).toContain(VALID_LEADER);

    const locked = await expedition<{ eligible: boolean; reason?: string }>(
      page,
      'checkEligibility',
      SLOT_MEMBER_2,
      VALID_LEADER,
    );
    expect(locked.eligible).toBe(false);
    expect(locked.reason).toBe('in-expedition');
  });

  test('run: la frontiera pending non matura in pausa e matura a ×4 sul clock reale', async ({ page }) => {
    await launchGoblinQuest(page);

    /* Risolve le decisioni di apertura finché la frontiera non è pending. */
    const pendingRun = await driveToPending(page);
    expect(pendingRun.frontier.status).toBe('pending');
    const nodeAtPause = pendingRun.nodeId;

    await pauseToggle(page).click();
    const tickAtPause = (await getClock(page)).currentTick;
    await page.waitForTimeout(2200);
    expect((await getClock(page)).currentTick).toBe(tickAtPause);
    expect(((await getRun(page))!).nodeId).toBe(nodeAtPause);

    /* ×4 riprende il clock: la frontiera matura in pochi secondi reali. */
    await speedButton(page, 4).click();
    await expect.poll(
      async () => {
        const r = await getRun(page);
        return r && (r.nodeId !== nodeAtPause || r.frontier.status === 'waiting') ? 'matured' : 'pending';
      },
      { timeout: 15_000 },
    ).toBe('matured');
  });

  test('esito: settlement applicato una volta — ricompense e destini come dati, nessun doppio settle', async ({ page }) => {
    const villageBefore = await expedition<VillageShape>(page, 'getVillage');
    await launchGoblinQuest(page);

    const terminal = await driveRunToEnd(page);
    expect(terminal.ended).toBe(true);
    expect(['reward', 'survived', 'fled', 'wipe']).toContain(terminal.outcome);

    /* Il teatro dei beat replaya gli eventi committati: Enter li skipa
     *  finché il rapporto non offre «Chiudi». Il POI è ancora sulla mappa
     *  (completed/failed) finché il report non viene dismissato. */
    await flushBeatTheatre(page);
    await expect(closeReportButton(page)).toBeVisible();
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toMatch(/^(completed|failed)$/);

    await waitForSettled(page);
    const settlement = await expedition<SettlementShape | null>(page, 'getSettlement');
    expect(settlement?.status).toBe('settled');
    expect(settlement?.plan.outcome).toBe(terminal.outcome);
    /* La release del loadout è modellata come effetto del piano. */
    expect(settlement?.plan.effects.some((e) => e.kind === 'loadout-release')).toBe(true);

    /* Destini come dati: morti e feriti scritti nell'aggregato villaggio. */
    const villageAfter = await expedition<VillageShape>(page, 'getVillage');
    for (const member of terminal.party) {
      const res = villageAfter.residents.find((r) => r.id === member.id);
      expect(res, `resident ${member.id} in roster`).toBeTruthy();
      if (member.dead) expect(res!.isDead).toBe(true);
      else if (member.wounded) expect(res!.isInjured).toBe(true);
    }
    /* Delta fungibile esatto: rewardResolved solo su 'reward', il bottino
     *  torna a meno di wipe. */
    const expectedGold =
      (terminal.outcome === 'reward' ? terminal.resolvedOffer?.rewardResolved ?? 0 : 0) +
      (terminal.outcome === 'wipe' ? 0 : terminal.gold ?? 0);
    expect(villageAfter.gold - villageBefore.gold).toBe(expectedGold);

    /* Nessun doppio settle: tick extra non muovono più il villaggio. */
    await advanceTicks(page, 20);
    const villageLater = await expedition<VillageShape>(page, 'getVillage');
    expect(villageLater.gold).toBe(villageAfter.gold);
    expect(villageLater.xp).toBe(villageAfter.xp);
  });

  test('i PG tornano a casa: dopo il settle il leader è di nuovo assegnabile', async ({ page }) => {
    await launchGoblinQuest(page);
    const terminal = await driveRunToEnd(page);
    await waitForSettled(page);

    /* Il gate rovine (fortitude|edge) prova la release: spaccaculi non è
     *  più «in-expedition» — salvo che sia morto in quest. */
    const released = await expeditionFor<{ eligible: boolean; reason?: string }>(
      page,
      POI_ROVINE,
      'checkEligibility',
      SLOT_ROVINE_LEADER,
      VALID_LEADER,
    );
    if (!terminal.party.some((m) => m.id === VALID_LEADER && m.dead)) {
      expect(released.eligible).toBe(true);
    }
    const village = await expedition<VillageShape>(page, 'getVillage');
    const leader = village.residents.find((r) => r.id === VALID_LEADER)!;
    expect(Boolean(leader.isDead)).toBe(Boolean(terminal.party.find((m) => m.id === VALID_LEADER)?.dead));
  });

  test('chiusura del rapporto: il POI sparisce dalla mappa e la run è consumata', async ({ page }) => {
    await launchGoblinQuest(page);
    await driveRunToEnd(page);
    await waitForSettled(page);
    await flushBeatTheatre(page);
    await expect(closeReportButton(page)).toBeVisible();

    await closeReportButton(page).click();
    await expect(questWindow(page)).toHaveCount(0);
    await expect(poiMarker(page)).toHaveCount(0);
    expect(await getRun(page)).toBeNull();
    /* Anche il marker rovine non è stato toccato. */
    await expect(page.locator(`[data-quest-poi-id="${POI_ROVINE}"]`)).toBeVisible({ timeout: 15_000 });
  });

  test('il POI consumato non torna dopo reload', async ({ page }) => {
    await launchGoblinQuest(page);
    await driveRunToEnd(page);
    await waitForSettled(page);
    await flushBeatTheatre(page);
    await closeReportButton(page).click();
    await expect(poiMarker(page)).toHaveCount(0);

    await page.reload();
    await waitForHooks(page);
    await page.waitForTimeout(500); // lascia al compositing della mappa un attimo
    await expect(poiMarker(page)).toHaveCount(0);
    expect(await getRun(page)).toBeNull();
    /* Il roster è ancora lì: i PG sono a casa e il loop può ripartire su rovine. */
    const eligible = await expeditionFor<{ eligible: boolean }>(
      page,
      POI_ROVINE,
      'checkEligibility',
      SLOT_ROVINE_LEADER,
      VALID_MEMBER,
    );
    expect(eligible.eligible).toBe(true);
  });
});
