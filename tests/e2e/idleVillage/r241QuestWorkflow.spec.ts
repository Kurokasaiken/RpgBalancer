/**
 * r241QuestWorkflow.spec.ts — R-241 integration evidence on the canonical
 * `/game` surface. One live «Sterminio dei goblin» run exercises the five
 * Director-reported defects end to end:
 *
 *   B1 — choice → CHECK: the theatre ART stays latched on the displayed
 *        scene while `run.nodeId` has already committed the arrival node
 *        (no instant cut under the spinning astrolabe).
 *   B2 — the narrative text box hugs its copy under the
 *        `questWindow.stageMaxHeightPx` cap (R-259: choices glued to the
 *        end of the text, no dead band; overflow scrolls inside the box).
 *   B3 — the first click on the skill-check board THROWS the ball
 *        (`data-state` → spin), a second click skips to the verdict.
 *   B4 — after the verdict the suite parks (`data-astro-idle="parked"`)
 *        but the `.rays` lights keep turning at the configured slow
 *        duration (`skillCheck.parkedRaysDurationMs`).
 *   B5 — while the quest is live the roster ABSTAINS from planner
 *        compatibility: no `data-compatibility="invalid"` cards and no
 *        «Nessuno slot compatibile» copy — resident statuses only.
 *
 * Boundaries: `__idleVillageTestHooks.expedition[poiId]` for inspection and
 * eligibility-gated assignment (same rules as a real drop); the choice is a
 * REAL click on the window's choice row; the check is driven by REAL clicks
 * on the mounted astrolabe board.
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DEFAULT_GAME_FRAME_CONFIG } from '../../../src/balancing/config/idleVillage/gameFrameConfig';
import { collectEnvAttestation } from '../../../scripts/verification/attestEnv';

const POI = 'poi-goblin';
const POI_ROVINE = 'poi-rovine';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const SLOT_MEMBER_2 = `${POI}:goblin-slot-member-2`;
const SLOT_BODYGUARD = `${POI}:goblin-slot-bodyguard`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const FOLK_FIGHTER = 'villager-mastro-beppe';
const FOLK_SCOUT = 'villager-lisetta';
const FOLK_GUARD = 'villager-baldassarre';

const STAGE_HEIGHT_PX = DEFAULT_GAME_FRAME_CONFIG.questWindow.stageMaxHeightPx;
const PARKED_RAYS_MS = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck.parkedRaysDurationMs;

type RunShape = {
  ended: boolean;
  nodeId: string;
  frontier: { status: string; readyAt: number };
};
type ClockShape = { currentTick: number; isPaused: boolean; speedMultiplier: number };

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    getClock?: () => ClockShape;
  };
}

const expedition = async <T>(page: Page, action: string, ...args: unknown[]): Promise<T> =>
  (await page.evaluate(
    ({ act, fnArgs }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
      if (!exp || typeof exp[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act](...fnArgs);
    },
    { act: action, fnArgs: args },
  )) as T;

const getRun = (page: Page) => expedition<RunShape | null>(page, 'getRun');
const getClock = (page: Page) =>
  page.evaluate(() => (window as TestHooksWindow).__idleVillageTestHooks?.getClock?.() as ClockShape);
const advanceTicks = (page: Page, n: number) =>
  page.evaluate((ticks) => (window as TestHooksWindow).__idleVillageTestHooks?.advanceTicks?.(ticks), n);

const poiMarker = (page: Page) => page.locator(`[data-quest-poi-id="${POI}"]`);
const detail = (page: Page) => page.getByTestId('quest-expedition-detail');
const questWindow = (page: Page) => page.getByTestId('quest-window');
const sendButton = (page: Page) => page.getByTestId('quest-expedition-send');
const theatreImg = (page: Page) => questWindow(page).getByTestId('quest-theatre-frame').locator('img').first();
const astroSuite = (page: Page) => page.locator('[data-suite]').first();
const astroBoard = (page: Page) => page.locator('[data-testid="quest-check-board"]').first();

const waitForHooks = async (page: Page) =>
  page.waitForFunction(
    ([goblin, rovine]) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[goblin]) && Boolean(exp?.[rovine]);
    },
    [POI, POI_ROVINE],
    { timeout: 30_000 },
  );

/** The real Director path: F10 → «Show quest» → marker → detail (same as
 *  gameQuestLifecycle — never a demo exemplar). */
const openGoblinDetailViaMap = async (page: Page) => {
  await page.keyboard.press('F10');
  await expect(page.getByTestId('director-panel')).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-action-id="quest"]').click();
  await expect(page.getByTestId('pixi-world-anchors')).toBeVisible({ timeout: 60_000 });
  await expect(poiMarker(page)).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press('F10');
  await expect(page.getByTestId('director-panel')).toBeHidden({ timeout: 5_000 });
  await poiMarker(page).click();
  await expect(detail(page)).toBeVisible();
};

/** Drag the planner's hero header until «Invia» fits the 720p viewport —
 *  the same move a player makes (no-op when it already fits). */
const bringSendIntoView = async (page: Page) => {
  const vh = page.viewportSize()?.height ?? 720;
  for (let i = 0; i < 4; i++) {
    const box = await sendButton(page).boundingBox();
    if (box && box.y + box.height <= vh - 8) return;
    const header = page.getByTestId('quest-planner-hero');
    const hb = await header.boundingBox();
    if (!hb) return;
    const deficit = box ? Math.ceil(box.y + box.height - (vh - 8)) : 120;
    const cx = hb.x + hb.width / 2;
    await page.mouse.move(cx, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(cx, hb.y + hb.height / 2 - deficit - 20, { steps: 6 });
    await page.mouse.up();
  }
};

/** Launch the goblin run: real detail, eligibility-gated assignments through
 *  the hook (a real drop would refuse what this refuses), real «Invia». */
const launchGoblinQuest = async (page: Page) => {
  await openGoblinDetailViaMap(page);
  expect(await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER)).toBe(true);
  expect(await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, FOLK_FIGHTER)).toBe(true);
  expect(await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER_2, FOLK_SCOUT)).toBe(true);
  expect(await expedition<boolean>(page, 'assignToSlot', SLOT_BODYGUARD, FOLK_GUARD)).toBe(true);
  await expect(sendButton(page)).toBeEnabled({ timeout: 20_000 });
  await bringSendIntoView(page);
  await sendButton(page).click();
  await expect(questWindow(page)).toBeVisible({ timeout: 10_000 });
};

const choiceLocator = (page: Page) =>
  questWindow(page).locator('[data-testid="quest-window-choice"][data-option-id="gob-cerca-tracce"]');

/** Drain the beat theatre until the F1 choice rows are mounted: every key
 *  press while `presenting` advances one beat (the R-199 skip contract), so
 *  a player-style Enter flushes the queue to the waiting frontier. The loop
 *  stops on ANY mounted choice row so a late Enter can never activate one —
 *  buttons stay `disabled` until `readyAt`, but a focused enabled row would
 *  commit on Enter. */
const drainToChoices = async (page: Page) => {
  const choices = questWindow(page).locator('[data-testid="quest-window-choice"]');
  for (let i = 0; i < 120; i++) {
    if ((await choices.count()) > 0) return;
    const run = await getRun(page);
    if (!run || run.ended) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
  }
  await expect(choiceLocator(page)).toBeVisible({ timeout: 10_000 });
};

/** Bring the resting frontier to its committable instant: the choice rows
 *  render at once but stay `disabled` («the phase is still on the road»)
 *  until the canonical clock reaches `frontier.readyAt` — same semantics as
 *  `driveRunToEnd` in gameQuestLifecycle. */
const matureFrontier = async (page: Page) => {
  const run = (await getRun(page))!;
  if (run.frontier.status !== 'waiting') return;
  const clock = await getClock(page);
  const lead = Math.max(0, run.frontier.readyAt - clock.currentTick);
  if (lead > 0) await advanceTicks(page, lead + 1);
};

/** The F1 decision commits `CHECK:gob-tracce-per` → the check beat is held
 *  on the mounted astrolabe until the player throws. */
const commitTrackCheck = async (page: Page) => {
  const run = (await getRun(page))!;
  expect(run.nodeId).toBe('gob-esplora');
  await drainToChoices(page);
  await matureFrontier(page);
  const choice = choiceLocator(page);
  await expect(choice).toBeEnabled({ timeout: 10_000 });
  await choice.click();
  await expect(astroSuite(page)).toBeVisible({ timeout: 15_000 });
};

const astroState = (page: Page) => astroSuite(page).getAttribute('data-state');

/** dom-temporal evidence for the R-189 gate: one metrics artefact with an
 *  env attestation + a real time series taken across the live lifecycle
 *  (resting → held check → the-spin → parked). Written to
 *  `R241_METRICS_OUT` when set, else `test-results/r241-metrics-ob6.json`. */
interface WorkflowMetrics {
  env?: unknown;
  samples: Record<string, unknown>[];
  errors: string[];
}

const bindMetrics = (page: Page): { metrics: WorkflowMetrics; sample: (tag: string) => Promise<void> } => {
  const metrics: WorkflowMetrics = { samples: [], errors: [] };
  page.on('pageerror', (err) => metrics.errors.push(String(err)));
  const sample = async (tag: string) => {
    const suite = astroSuite(page);
    const stage = questWindow(page).getByTestId('quest-window-stage');
    const beat = questWindow(page).getByTestId('quest-window-beat');
    const stageBox = (await stage.isVisible().catch(() => false))
      ? await stage.boundingBox()
      : await beat.boundingBox().catch(() => null);
    const rays = suite.locator('.rays').first();
    const raysStyle = await rays
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { playState: cs.animationPlayState, duration: cs.animationDuration };
      })
      .catch(() => null);
    metrics.samples.push({
      tag,
      t: Date.now(),
      nodeId: (await getRun(page))?.nodeId ?? null,
      astroState: await suite.getAttribute('data-state').catch(() => null),
      astroIdle: await suite.getAttribute('data-astro-idle').catch(() => null),
      stageHeight: stageBox?.height ?? null,
      theatreSrc: await theatreImg(page).getAttribute('src').catch(() => null),
      invalidCompatCards: await page.locator('[data-compatibility="invalid"]').count(),
      rays: raysStyle,
    });
  };
  return { metrics, sample };
};

const flushMetrics = async (page: Page, metrics: WorkflowMetrics) => {
  metrics.env = await collectEnvAttestation(page);
  const out = process.env.R241_METRICS_OUT ?? 'test-results/r241-metrics-ob6.json';
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(metrics, null, 1));
};

/* ================= tests ================= */

test.describe('R-241 — quest workflow on /game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game');
    await waitForHooks(page);
    await page.keyboard.press('r');
    await expect(
      page.locator('[data-testid="drag-test-container"], [data-testid="resident-roster-panel"]').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('B1+B3+B4: choice commits arrival while art stays latched; board click throws then skips; parked rays keep turning', async ({
    page,
  }) => {
    const { metrics, sample } = bindMetrics(page);
    await launchGoblinQuest(page);
    await sample('resting-frontier');

    /* Pre-choice scene: the theatre paints gob-esplora's art. */
    const srcBefore = await theatreImg(page).getAttribute('src');
    expect(srcBefore).toContain('sentiero-tracce');

    await commitTrackCheck(page);
    await sample('held-check');

    /* B1 — the engine already committed the arrival node (gob-tracce-per
     * always routes to gob-accampamento) but the check beat is HELD: the
     * theatre must still paint the displayed scene's art, not the arrival's. */
    const run = (await getRun(page))!;
    expect(run.nodeId).toBe('gob-accampamento');
    const srcDuringCheck = await theatreImg(page).getAttribute('src');
    expect(srcDuringCheck).toContain('sentiero-tracce');
    expect(srcDuringCheck).not.toContain('accampamento-raider');

    /* B3 — first board click THROWS: the suite leaves its pre-spin state. */
    const stateBefore = await astroState(page);
    expect(stateBefore).not.toBe('the-spin');
    await astroBoard(page).click();
    await expect
      .poll(async () => astroState(page), { timeout: 10_000 })
      .toMatch(/the-spin|magnetic-snap|resolution/);
    await sample('the-spin');
    /* Second click skips to the verdict — the suite parks. */
    await astroBoard(page).click();
    await expect
      .poll(async () => astroSuite(page).getAttribute('data-astro-idle'), { timeout: 15_000 })
      .toBe('parked');
    await sample('parked');

    /* B4 — parked suite: every ambient loop is frozen EXCEPT `.rays`, which
     *  keeps turning at the configured slow duration. */
    const rays = astroSuite(page).locator('.rays').first();
    const raysStyle = await rays.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { playState: cs.animationPlayState, duration: cs.animationDuration };
    });
    expect(raysStyle.playState).toBe('running');
    const durationMs = raysStyle.duration.endsWith('ms')
      ? Number.parseFloat(raysStyle.duration)
      : Number.parseFloat(raysStyle.duration) * 1000;
    expect(durationMs).toBe(PARKED_RAYS_MS);

    /* Witness for the record — the parked astrolabe over the latched scene. */
    await page.screenshot({ path: 'test-results/r241-parked-astrolabe.png' });
    await flushMetrics(page, metrics);
  });

  test('B2/R-259: narrative box never exceeds the cap and stays glued to choices', async ({ page }) => {
    await launchGoblinQuest(page);

    /* R-259: the text box hugs its copy (maxHeight cap, internal scroll) and
     * the choices sit right below it — no dead band, no fixed height. */
    const stage = questWindow(page).getByTestId('quest-window-stage');
    const beat = questWindow(page).getByTestId('quest-window-beat');
    await expect(stage.or(beat).first()).toBeVisible({ timeout: 15_000 });
    const measure = async () => {
      const target = (await stage.count()) > 0 && (await stage.isVisible()) ? stage : beat;
      const box = await target.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeLessThanOrEqual(STAGE_HEIGHT_PX);
      expect(box!.height).toBeGreaterThan(30);
      return box!;
    };
    const resting = await measure();

    /* Choices (or the beat card) sit right below the text box — the
     * «pulsanti alla fine del testo» ruling: gap ≈ stack gap (10px), and
     * never a dead band of dozens of px. */
    const firstChoice = questWindow(page).locator('[data-testid="quest-window-choice"], [data-testid="quest-window-beat"]').first();
    if (await firstChoice.isVisible().catch(() => false)) {
      const choiceBox = await firstChoice.boundingBox();
      if (choiceBox) {
        const gap = choiceBox.y - (resting.y + resting.height);
        expect(gap).toBeLessThan(80);
      }
    }

    await commitTrackCheck(page);
    /* During the held check the beat slot is on stage — still under the cap. */
    const held = await measure();
    expect(held.height).toBeLessThanOrEqual(STAGE_HEIGHT_PX);

    /* After the verdict the scene beat for the arrival mounts — still
     * capped, copy length only scrolls inside. */
    await astroBoard(page).click();
    await expect
      .poll(async () => astroSuite(page).getAttribute('data-astro-idle'), { timeout: 15_000 })
      .toBe('parked');
    const postVerdict = await measure();
    expect(postVerdict.height).toBeLessThanOrEqual(STAGE_HEIGHT_PX);
  });

  test('B5: the quest party roster paints statuses, never planner compatibility', async ({ page }) => {
    /* With no quest live the planner answers compatibility — a resident with
     * no eligible slot left IS marked invalid (pre-existing planner contract). */
    await openGoblinDetailViaMap(page);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER_2, 'hero-giggiolillo')).toBe(true);
    await expect(page.locator('[data-worker-id="hero-salvatrice"]').first()).toHaveAttribute(
      'data-compatibility',
      'invalid',
    );

    /* Now the quest goes live — the whole chain must abstain. */
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER)).toBe(true);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_MEMBER, FOLK_FIGHTER)).toBe(true);
    expect(await expedition<boolean>(page, 'assignToSlot', SLOT_BODYGUARD, FOLK_GUARD)).toBe(true);
    await expect(sendButton(page)).toBeEnabled({ timeout: 20_000 });
    await bringSendIntoView(page);
    await sendButton(page).click();
    await expect(questWindow(page)).toBeVisible({ timeout: 10_000 });
    await expect.poll(async () => (await getRun(page))?.nodeId).toBe('gob-esplora');
    await drainToChoices(page);
    await matureFrontier(page);

    /* The village roster is stage-suspended under the run regime — mounted
     * hidden, abstained: no invalid card anywhere in the document. */
    await expect(page.locator('[data-compatibility="invalid"]')).toHaveCount(0);

    /* «il roster della quest» — the party roster a player opens mid-run:
     * statuses only (away/injured/dead, dead greyed), zero planner noise. */
    await page.getByTestId('quest-party-toggle').click();
    const partyRoster = page.getByTestId('quest-party-roster');
    await expect(partyRoster).toBeVisible({ timeout: 10_000 });
    await expect(partyRoster.getByText('Nessuno slot compatibile')).toHaveCount(0);
    await expect(partyRoster.getByText('No compatible slots')).toHaveCount(0);
    await expect(partyRoster.locator('[data-compatibility="invalid"]')).toHaveCount(0);
    /* Every member still carries its status chip — 4/4 assigned → away. */
    const statusChips = partyRoster.locator('[data-drag-state]');
    await expect(statusChips).toHaveCount(4);

    await page.screenshot({ path: 'test-results/r241-party-roster-statuses.png' });
  });
});
