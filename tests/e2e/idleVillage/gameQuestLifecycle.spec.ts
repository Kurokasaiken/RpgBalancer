/**
 * gameQuestLifecycle.spec.ts — R-119: the COMPLETE lifecycle of the quest
 * «Goblin Extermination» on the canonical `/game` surface, validated piece
 * by piece:
 *
 *   map + roster boot → Director «Show quest» (the REAL button) → click the
 *   real POI marker → planning → roster
 *   assignment (real drag + hook, same eligibility) → forecast →
 *   «Invia spedizione» → run in the QuestRunWindow → frontiers maturing on
 *   the canonical clock → HUD time controls (pause / resume / ×N, one
 *   driver only) → decisions → terminal outcome → settlement applied once
 *   (rewards + resident fates as data) → party back home → il POI goblin è
 *   `repeatable` (R-200): dismissed il rapporto, il marker torna
 *   `available` — mai consumato, anche dopo reload — e la quest si rifà.
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
const SLOT_BODYGUARD = `${POI}:goblin-slot-bodyguard`;
const POI_ROVINE = 'poi-rovine';
const SLOT_ROVINE_LEADER = `${POI_ROVINE}:rovine-slot-leader`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const VALID_MEMBER = 'hero-giggiolillo';
const INVALID_RESIDENT = 'hero-salvatrice';
/* Popolani (isHero:false, stessa SavedCharacter shape del Character
 *  Manager): tag tarati sugli slot opzionali goblin. */
const FOLK_FIGHTER = 'villager-mastro-beppe'; // member-1   — 'fortitude'
const FOLK_SCOUT = 'villager-lisetta'; //        member-2   — 'precision'
const FOLK_GUARD = 'villager-baldassarre'; //   bodyguard  — 'warden'

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
  /* Journey legs: `readyAt` is the pending-forever sentinel and the authored
   *  route pins drive the march instead (same shape the cluster spec reads). */
  journey?: {
    snapshot: { travelDays: number; ticksPerDay: number };
    journal: {
      processedUpToTick: number;
      faseStartedAtTick: number;
      accumulatedParkedTicks: number;
      beats: { pin: number; openedAtTick: number | null }[];
    };
  };
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
  residents: { id: string; isDead: boolean; isInjured: boolean; injuredUntilTick: number | null; isOnExpedition?: boolean }[];
};
type ClockShape = { currentTick: number; isPaused: boolean; speedMultiplier: number };
type EventLogShape = {
  type: string | null;
  residentId: string | null;
  messageKey: string | null;
  messageParams: Record<string, string | number> | null;
};

interface TestHooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    getClock?: () => ClockShape;
    revealQuestPois?: () => void;
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
/* R-199 pt.14: la relazione di ritorno vive nel `quest-reward-popup` — placca
 *  centrata SOPRA la window che copre fisicamente `quest-window-close-report`.
 *  Chiuderla (bottone staged «Chiudi» o la X sempre presente in title row) è
 *  il dismissal canonico del report: `closeReward` sgancia la run e rende il
 *  POI, esattamente come il «Chiudi il rapporto» della window — che resta il
 *  fallback quando il popup non è montato. */
const dismissQuestReport = async (page: Page) => {
  const popup = page.getByTestId('quest-reward-popup');
  if (await popup.isVisible()) {
    const stagedClose = popup.getByTestId('quest-reward-close');
    if (await stagedClose.isVisible()) {
      await stagedClose.click();
    } else {
      await popup.locator('[data-hud-controls] button').first().click();
    }
    return;
  }
  await closeReportButton(page).click();
};
const speedGroup = (page: Page) => page.locator('[role="radiogroup"]');
const pauseToggle = (page: Page) => speedGroup(page).getByRole('radio').first();
const speedButton = (page: Page, mult: 1 | 2 | 4) => speedGroup(page).getByRole('radio', { name: `×${mult}` });

/** The HUD ribbon's gold readout (`ResourceReadout` role=group, aria-label
 *  «<label>: <value>»): parses the displayed amount — the visible proof the
 *  settlement moved what the player sees, not just the store. */
const goldReadoutValue = async (page: Page): Promise<number> => {
  const label = await page.getByRole('group', { name: /gold|oro/i }).first().getAttribute('aria-label');
  const digits = (label ?? '').replace(/[^\d]/g, '');
  if (!digits) throw new Error(`gold readout not parseable: "${label}"`);
  return Number(digits);
};

/** Settlement contract on gold: `rewardResolved` pays out only on the
 *  'reward' outcome; the loot the run carried home survives every ending
 *  except a wipe. Same formula wherever the launch came from. */
const expectedGoldDelta = (terminal: RunShape) =>
  (terminal.outcome === 'reward' ? terminal.resolvedOffer?.rewardResolved ?? 0 : 0) +
  (terminal.outcome === 'wipe' ? 0 : terminal.gold ?? 0);

/** Reveal the quest offers through the REAL Director toggle (R-143/R-144):
 *  F10 → «Show quest» — the exact click a Director makes; the marker that
 *  mounts is the real POI, never a demo exemplar. The `revealQuestPois`
 *  window hook stays for `?capture=1` only, where the panel is hidden —
 *  the suite always drives the button itself. */
const revealQuestPois = async (page: Page) => {
  await page.keyboard.press('F10');
  await expect(page.getByTestId('director-panel')).toBeVisible({ timeout: 10_000 });
  /* dispatchEvent: l'action può restare coperta dal layer animazione del
   *  pannello oltre i 10s di actionability sotto carico — il listener React
   *  è lo stesso di un click Director (firma 773/798, 2026-10-23). */
  await page.locator('[data-action-id="quest"]').dispatchEvent('click');
  /* L'anchor layer Pixi nasce `visibility:hidden` e si accende solo quando la
   *  camera ha completato l'init (caricamento texture incluso) — sotto carico
   *  può superare i 15s, quindi prima attendiamo il layer, poi il marker. */
  await expect(page.getByTestId('pixi-world-anchors')).toBeVisible({ timeout: 60_000 });
  await expect(poiMarker(page)).toBeVisible({ timeout: 15_000 });
  /* Fold the panel back so it can't cover the marker click that follows. */
  await page.keyboard.press('F10');
  await expect(page.getByTestId('director-panel')).toBeHidden({ timeout: 5_000 });
};

/** Click the real POI marker on the map — the same path a player takes. */
const openGoblinDetailViaMap = async (page: Page) => {
  await revealQuestPois(page);
  await poiMarker(page).click();
  await expect(detail(page)).toBeVisible();
  /* POI-D/T-B10: il titolo dello scenario vive nella placca sopra la hero
   *  (`quest-planner-title`); la hero letterbox è solo arte + drag handle. */
  await expect(page.getByTestId('quest-planner-title')).toContainText(
    'Goblin Extermination',
  );
};

/** The expedition panel grew past a 720p viewport (S3 OUTCOME zone):
 *  drag its header up until «Invia» is inside — the same move a player
 *  would make. No-op when everything already fits. */
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

/** Wait for the session's own assignments map to confirm the drop — the
 *  same feedback a player reads (the slot shows the resident). Without it
 *  a missed drop is invisible until `send()` ships a short party. */
const waitForSlotAssignment = (page: Page, slotId: string, residentId: string, timeout = 5_000) =>
  page.waitForFunction(
    ({ pid, sid, rid }) => {
      const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
        | { getAssignments?: () => Record<string, string | null> }
        | undefined;
      return exp?.getAssignments?.()?.[sid] === rid;
    },
    { pid: POI, sid: slotId, rid: residentId },
    { timeout },
  );

/** Real pointer drag card→slot inside the planner — the same move a
 *  player makes on the assignment panel (scrolls each endpoint into view
 *  first: the panel grew taller than a 720p viewport). A drop that missed
 *  is re-dragged once, as a player would; if it still didn't take, the
 *  test fails on the slot — never silently on the launched party. */
const assignViaRealDrag = async (page: Page, residentId: string, slotId: string) => {
  const card = page.locator(`[data-worker-id="${residentId}"]`).first();
  const slot = page.locator(`[data-slot-id="${slotId}"]`).first();
  /* In-page scrollIntoView: `locator.scrollIntoViewIfNeeded` waits for the
   * element to be "stable" — under a live Pixi page the cards keep shifting
   * a pixel at a time and the stability gate can outlast the test budget. */
  const scrollIntoView = async (target: typeof card) =>
    target.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' })).catch(() => undefined);
  for (let attempt = 0; attempt < 2; attempt++) {
    await scrollIntoView(slot);
    await scrollIntoView(card);
    await dragResidentPointer(page, card, slot);
    try {
      await waitForSlotAssignment(page, slotId, residentId);
      return;
    } catch {
      /* the drop missed — retry once below */
    }
  }
  throw new Error(`real drag never assigned ${residentId} to ${slotId}`);
};

/** Planning → 1 eroe + 3 popolani trascinati negli slot (party completo) →
 *  real click on «Invia spedizione». */
const launchGoblinQuest = async (page: Page) => {
  await openGoblinDetailViaMap(page);
  await assignViaRealDrag(page, VALID_LEADER, SLOT_LEADER);
  await assignViaRealDrag(page, FOLK_FIGHTER, SLOT_MEMBER);
  await assignViaRealDrag(page, FOLK_SCOUT, SLOT_MEMBER_2);
  await assignViaRealDrag(page, FOLK_GUARD, SLOT_BODYGUARD);
  await expect(sendButton(page)).toBeEnabled({ timeout: 15_000 });
  await bringSendIntoView(page);
  /* dispatchEvent: il bottone «Invia» resta hit-test-blocked dal bordo del
   *  pannello/scroll residue sotto carico oltre i 10s di actionability —
   *  stesso listener React del click giocatore (firma 730, 2026-10-23). */
  await sendButton(page).dispatchEvent('click');
  await expect(questWindow(page)).toBeVisible({ timeout: 10_000 });
};

/**
 * Drain presentation beats in-page: `skip()` is a functional update so N
 * keydowns consume N narrative beats per round-trip — a single Enter per
 * Playwright call (~300ms) loses to beats generated at ×4 / advanceTicks
 * bursts (20+ pile-up measured under load, 2026-10-23). Window-dispatch:
 * the R-199 listener sees `event.target` as non-Element and routes straight
 * to `advancePresentation` regardless of focus.
 */
const drainBeats = (page: Page, n = 8) =>
  page.evaluate((count) => {
    for (let k = 0; k < count; k++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    }
  }, n);

/**
 * Advance the canonical clock until the current frontier can progress:
 * - `waiting`/`pending` with a finite `readyAt` → straight to `readyAt + 1`.
 * - the journey travel sentinel (`readyAt === Number.MAX_SAFE_INTEGER`,
 *  pending forever by design) → only to the next authored route pin (or the
 *  leg endpoint), never to the sentinel.
 * Without this a pending leg matures `advanceTicks(15)` at a time — dozens
 * of polling iterations × up-to-8s waits — and the run dies inside the
 * 120s test budget mid-drive (the real R-119 timeout signature).
 */
const matureFrontier = async (page: Page, run: RunShape) => {
  if (run.frontier.readyAt === Number.MAX_SAFE_INTEGER && run.journey) {
    const { snapshot, journal } = run.journey;
    const consumed = Math.max(
      0,
      journal.processedUpToTick - journal.faseStartedAtTick - journal.accumulatedParkedTicks,
    );
    const total = snapshot.travelDays * snapshot.ticksPerDay;
    const nextPin = Math.min(
      1,
      ...journal.beats.filter((beat) => beat.openedAtTick === null).map((beat) => beat.pin),
    );
    const ticksToNextEvent = Math.max(0, Math.ceil(nextPin * total - consumed));
    await advanceTicks(page, Math.max(1, ticksToNextEvent + 1));
    return;
  }
  const clock = await getClock(page);
  const lead = Math.max(0, run.frontier.readyAt - (clock?.currentTick ?? 0));
  await advanceTicks(page, lead + 1);
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
      /* R-199: a waiting frontier is visible at once but committable only at
       *  `readyAt` (the march to the node costs nodeTicks) — the driver waits
       *  the phase slot on the canonical clock before choosing. */
      await matureFrontier(page, run);
      const options = await expedition<string[]>(page, 'getOptions');
      if (!options.length) throw new Error(`waiting frontier without options at ${run.nodeId}`);
      repeats = run.nodeId === lastNode ? repeats + 1 : 0;
      lastNode = run.nodeId;
      await expedition<void>(page, 'choose', options[Math.min(repeats, options.length - 1)]);
      /* Flush il teatro mentre il motore corre: ogni commit accoda beat e la
       *  window li replaya serialmente — senza un avanzamento continuo alla
       *  fine restano ~28 beat held da smaltire nel timeout del test. */
      await drainBeats(page).catch(() => undefined);
    } else {
      await matureFrontier(page, run);
      await drainBeats(page).catch(() => undefined);
      /* La wait serve solo a far osservare a syncClock il salto di tick.
       *  Su una journey leg `nodeId` E `readyAt` restano sentinel
       *  (MAX_SAFE_INTEGER) tra un pin e l'altro → il wait faceva timeout
       *  pieno 8s per OGNI pin (~25 pin ≈ 200s bruciati — la firma del
       *  timeout 300s di «leader riassegnabile», 2026-10-23). Uscita
       *  anticipata appena i tick consumati avanzano, bound 1.5s. */
      const consumed0 = run.journey
        ? Math.max(0, run.journey.journal.processedUpToTick - run.journey.journal.faseStartedAtTick - run.journey.journal.accumulatedParkedTicks)
        : 0;
      await page.waitForFunction(
        ({ pid, node, fv, c0 }) => {
          const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
            | { getRun?: () => RunShape | null }
            | undefined;
          const r = exp?.getRun?.();
          if (!r || r.ended || r.nodeId !== node || r.frontier.status !== 'pending' || r.frontier.readyAt !== fv) return true;
          if (!r.journey) return false;
          const consumed = Math.max(0, r.journey.journal.processedUpToTick - r.journey.journal.faseStartedAtTick - r.journey.journal.accumulatedParkedTicks);
          return consumed > c0;
        },
        { pid: POI, node: run.nodeId, fv: run.frontier.readyAt, c0: consumed0 },
        { timeout: 1_500 },
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
      const clock = await getClock(page);
      const lead = Math.max(0, run.frontier.readyAt - clock.currentTick);
      if (lead > 0) await advanceTicks(page, lead + 1);
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

/** Wait until the settlement marker lands `settled` on the run. R-260:
 *  `settled` is gated on the report's dismissal — this drives the real
 *  commit boundary first (`expedition.commitSettlement`, the same callback
 *  the popup's «Collect» calls) so the run settles while staying mounted
 *  for post-settle reads; the UI dismissal itself is exercised separately
 *  by `dismissQuestReport`. */
const waitForSettled = async (page: Page) => {
  await expedition<void>(page, 'commitSettlement');
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
};

/**
 * Flush the beat theatre: committed beats replay in the window (click /
 * Enter skips one beat each) and the «Chiudi» report affordance only shows
 * once the queue is empty. Presses Enter until the report surfaces.
 */
const flushBeatTheatre = async (page: Page) => {
  /* PLAN-043 WS-4: i check beat si tengono sulla colonna destra
   *  `quest-check-column` — il pulsante Throw (`.da-tira`) resta montato per
   *  tutto il beat held, quindi il ramo «tira visibile → click» non può
   *  sostituire Enter: se il click viene intercettato (verdict card / toast
   *  sopra il board) il loop non avanzerebbe mai. Enter è la via garantita
   *  (`advancePresentation` → `progress()` → throw/skipToResult; post-verdict
   *  è no-op e vale l'auto-dismiss). Se la colonna è `data-check-armed` un
   *  click sulla colonna la dismette direttamente, coprendo i casi in cui
   *  l'auto-dismiss non è configurato. */
  const astroThrow = page.locator('.da-tira');
  const checkColumn = page.getByTestId('quest-check-column');
  const checkOverlay = page.getByTestId('quest-check-overlay');
  let lastFocus = 'n/a';
  for (let i = 0; i < 400; i++) {
    if (await closeReportButton(page).isVisible()) return;
    if (await astroThrow.isVisible().catch(() => false)) {
      /* dispatchEvent salta l'hit-test: `.da-tira` resta visibile per tutto il
       *  beat held e sotto la verdict card / FX overlay un click actionability-
       *  gated brucia il default 30s per iterazione (era il vero timeout). Il
       *  listener React è lo stesso di un click utente. */
      await astroThrow.dispatchEvent('click').catch(() => undefined);
    }
    if (await checkColumn.getAttribute('data-check-armed').catch(() => null)) {
      await checkColumn.dispatchEvent('click').catch(() => undefined);
    }
    /* Focus hygiene (23-10 flake): Enter is the guaranteed advance path, but
     *  only when its target is NOT a button — the window's keydown guard
     *  (`target.closest('button, a[href]')`) routes presses on a focused
     *  button away from `advancePresentation`, and the native activation
     *  re-clicks `.da-tira` mid-flight (re-throw → the ball never lands).
     *  Blur whatever holds focus so Enter lands on <body> every loop. */
    const focus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el ? `${el.tagName}.${(el.className ?? '').toString().slice(0, 40)}` : 'none';
      if (el && el !== document.body) el.blur();
      return tag;
    });
    if (focus !== 'none' && focus !== 'BODY') lastFocus = focus;
    /* Burst drain — same contract as driveRunToEnd's `drainBeats` (the
     *  R-199 guard routes a window-dispatched keydown straight to
     *  `advancePresentation` regardless of focus). */
    await drainBeats(page);
    /* Overlay variant (small viewports / no cluster geometry): the centred
     *  plaque has no data-check-armed contract — a board-area dispatch rides
     *  the same progress()/dismiss path as the column click. */
    if (await checkOverlay.isVisible().catch(() => false)) {
      await checkOverlay.dispatchEvent('click').catch(() => undefined);
    }
    await page.waitForTimeout(120);
    /* Cheap diagnostics on the last iterations: what is on stage and what
     *  state the presenter reports — turns the next failure into a witness
     *  instead of another guess. */
    if (i > 380) {
      lastFocus += await page.evaluate(() => {
        const col = document.querySelector<HTMLElement>('[data-testid="quest-check-column"]');
        const ov = document.querySelector<HTMLElement>('[data-testid="quest-check-overlay"]');
        const suite = document.querySelector<HTMLElement>('[data-suite]');
        const beat = document.querySelector<HTMLElement>('[data-testid="quest-window-beat"]');
        return ` | col=${Boolean(col)} ov=${Boolean(ov)} state=${suite?.dataset.state ?? '-'} resolved=${col?.dataset.checkResolved ?? '-'} beat="${beat?.textContent?.slice(0, 40) ?? '-'}"`;
      }).catch(() => ' | diag-failed');
    }
  }
  throw new Error(`beat theatre never reached the expedition report (last focused: ${lastFocus})`);
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

test.describe('R-119 — ciclo di vita «Goblin Extermination» su /game', () => {
  test.beforeEach(async ({ page }) => {
    /* Ogni test guida un ciclo di vita completo: reveal POI (ancore Pixi
     *  fino a 60s sotto carico) → 4 drag reali → run intera → teatro →
     *  settle. Il default 120s è strutturalmente stretto per questa
     *  superficie — FullFlow R-183 dichiara 420s per lo stesso percorso. */
    test.setTimeout(300_000);
    await page.goto('/game');
    await waitForHooks(page);
    /* Panels open closed on every /game entry (PLAN-031 follow-up): summon the
     * roster as a player would before looking for its cards. */
    await page.keyboard.press('r');
    await expect(page.locator('[data-testid="drag-test-container"], [data-testid="resident-roster-panel"]').first()).toBeVisible({ timeout: 15_000 });
  });

  // INV:CTR-game-008.INV-1
  test('boot: roster seedato — 3 eroi + 3 popolani — offerta fresca `available` con halo vuota', async ({
    page,
  }) => {
    await expect(page.locator(`[data-worker-id="${VALID_LEADER}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${VALID_MEMBER}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${INVALID_RESIDENT}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${FOLK_FIGHTER}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${FOLK_SCOUT}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-worker-id="${FOLK_GUARD}"]`).first()).toBeVisible();
    /* R-200 supera R-124: le offerte si rivelano da sole a stagger dopo il
     *  veil («Mostra quest» è ora un trigger one-way che salta la coda).
     *  Ciò che resta del vecchio contratto: l'offerta fresca legge
     *  `available` con halo VUOTA — il sigillo non è scritto finché la run
     *  non parte. */
    await revealQuestPois(page);
    expect(await poiStatus(page)).toBe('available');
    await expect(poiMarker(page).locator('.poiv3_5--expiring')).toHaveCount(0);
    await expect(poiMarker(page).locator('.poiv3_5__seal-halo path, .poiv3_5__seal-core path')).toHaveCount(0);
  });

  // INV:CTR-game-008.INV-1
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
    await assignViaRealDrag(page, VALID_LEADER, SLOT_LEADER);

    const assignments = await expedition<Record<string, string | null>>(page, 'getAssignments');
    expect(assignments[SLOT_LEADER]).toBe(VALID_LEADER);
    await expect(page.getByTestId('quest-expedition-forecast')).toHaveAttribute('data-forecast-state', 'ready', {
      timeout: 20_000,
    });
    await expect(sendButton(page)).toBeEnabled();
    expect(await expedition<object | null>(page, 'getEstimate')).not.toBeNull();
  });

  // INV:CTR-game-008.INV-3
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

  // INV:CTR-game-008.INV-3
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

  // INV:CTR-game-009.INV-1
  test('lancio: «Invia spedizione» apre la QuestRunWindow; POI in_progress e leader «in-expedition»', async ({ page }) => {
    await launchGoblinQuest(page);
    await expect(detail(page)).toHaveCount(0);
    await expect(questWindow(page)).toBeVisible();
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('in_progress');

    const run = (await getRun(page))!;
    expect(run.nodeId).toBe('gob-esplora');
    /* Party completo: 1 eroe + 3 popolani — i quattro id assegnati dai
     *  drag nel pannello di assegnazione. */
    const partyIds = run.party.map((m) => m.id);
    expect(partyIds).toHaveLength(4);
    expect(partyIds).toEqual(
      expect.arrayContaining([VALID_LEADER, FOLK_FIGHTER, FOLK_SCOUT, FOLK_GUARD]),
    );

    const locked = await expedition<{ eligible: boolean; reason?: string }>(
      page,
      'checkEligibility',
      SLOT_MEMBER_2,
      VALID_LEADER,
    );
    expect(locked.eligible).toBe(false);
    expect(locked.reason).toBe('in-expedition');
  });

  // INV:CTR-game-008.INV-3
  test('run: la frontiera pending non matura in pausa e matura a ×4 sul clock reale', async ({ page }) => {
    await launchGoblinQuest(page);

    /* Pausa PRIMA di drivare: con la semantica `readyAt` (R-199) il gap fra
     *  frontiera pending e click di pausa lascerebbe ai tick reali il tempo
     *  di maturare — race. Il driver risolve le attese via `advanceTicks`
     *  imperativo, che funziona anche a simulazione ferma.
     * PLAN-067: la quest window in cluster copre il radiogroup velocità
     * (top-left, dietro l'header) — `dispatchEvent` chiama il vero handler
     * React del radio saltando solo l'occlusione geometrica; la lettura del
     *lo stato resta sullo store canonico. */
    await pauseToggle(page).dispatchEvent('click');
    const pendingRun = await driveToPending(page);
    expect(pendingRun.frontier.status).toBe('pending');
    const nodeAtPause = pendingRun.nodeId;

    const tickAtPause = (await getClock(page)).currentTick;
    await page.waitForTimeout(2200);
    expect((await getClock(page)).currentTick).toBe(tickAtPause);
    expect(((await getRun(page))!).nodeId).toBe(nodeAtPause);

    /* ×4 riprende il clock: la frontiera matura in pochi secondi reali.
     *  Stesso seam di sopra — il radio è sotto la window (dispatchEvent). */
    await speedButton(page, 4).dispatchEvent('click');
    await expect.poll(
      async () => {
        const r = await getRun(page);
        return r && (r.nodeId !== nodeAtPause || r.frontier.status === 'waiting') ? 'matured' : 'pending';
      },
      { timeout: 15_000 },
    ).toBe('matured');
  });

  // INV:CTR-game-008.INV-4
  test('esito: settlement applicato una volta — ricompense e destini come dati, nessun doppio settle', async ({ page }) => {
    const villageBefore = await expedition<VillageShape>(page, 'getVillage');
    const goldReadoutBefore = await goldReadoutValue(page);
    await launchGoblinQuest(page);

    const terminal = await driveRunToEnd(page);
    expect(terminal.ended).toBe(true);
    expect(['reward', 'survived', 'fled', 'wipe']).toContain(terminal.outcome);

    /* Congela il clock SUBITO: le ferite guariscono dopo
     *  `QUEST_SETTLEMENT.woundRecoveryTicks` (5) tick, e flushBeatTheatre
     *  da solo può bruciarne di più — su clock vivo la lettura dei destini
     *  sotto corre contro lo scadere dell'infortunio. In pausa lo snapshot
     *  non può scadere mentre lo leggiamo. La window copre il radiogroup
     *  (PLAN-067 cluster) → dispatchEvent come sopra. */
    await pauseToggle(page).dispatchEvent('click');
    await expect(pauseToggle(page)).toHaveAttribute('aria-checked', 'true');

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

    /* Destini come dati: il piano dichiara l'effetto (contratto
     *  deterministico) e l'aggregato villaggio lo riflette (clock fermo,
     *  quindi la ferita non può essere ancora sanata). */
    const villageAfter = await expedition<VillageShape>(page, 'getVillage');
    for (const member of terminal.party) {
      const expectedKind = member.dead ? 'resident-dead' : member.wounded ? 'resident-wounded' : null;
      if (expectedKind) {
        expect(
          settlement?.plan.effects.some((e) => e.kind === expectedKind && e.residentId === member.id),
          `plan effects has ${expectedKind} for ${member.id}`,
        ).toBe(true);
      }
      const res = villageAfter.residents.find((r) => r.id === member.id);
      expect(res, `resident ${member.id} in roster`).toBeTruthy();
      if (member.dead) expect(res!.isDead).toBe(true);
      /* R-199: the march now spans `questWindow.durationDays` on the game
       *  clock — a wound taken early can legitimately expire during the run
       *  and heal at release (isInjured=false + injuredUntilTick cleared).
       *  The durable record is the `resident-wounded` plan effect above; here
       *  the aggregate must be consistent: still injured, or healed. */
      else if (member.wounded) {
        expect(
          res!.isInjured || res!.injuredUntilTick == null,
          `resident ${member.id}: wounded but mid-state (isInjured=${res!.isInjured}, injuredUntilTick=${res!.injuredUntilTick})`,
        ).toBe(true);
      }
    }
    /* Delta fungibile esatto: rewardResolved solo su 'reward', il bottino
     *  torna a meno di wipe. */
    const expectedGold = expectedGoldDelta(terminal);
    expect(villageAfter.gold - villageBefore.gold).toBe(expectedGold);

    /* E il pannello risorse nel ribbon HUD mostra lo stesso delta — la
     *  ricompensa arriva anche a ciò che il giocatore vede. */
    expect((await goldReadoutValue(page)) - goldReadoutBefore).toBe(expectedGold);

    /* Nessun doppio settle: tick extra non muovono più il villaggio. */
    await advanceTicks(page, 20);
    const villageLater = await expedition<VillageShape>(page, 'getVillage');
    expect(villageLater.gold).toBe(villageAfter.gold);
    expect(villageLater.xp).toBe(villageAfter.xp);
  });

  // INV:CTR-game-008.INV-4
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
    /* E OGNI sopravvissuto del party è rilasciato: il motivo di un rifiuto
     *  non può essere «in-expedition» (un popolano può fallire il gate
     *  rovine per tag — legittimo — ma mai perché ancora «fuori»). */
    for (const member of terminal.party) {
      if (member.dead) continue;
      const check = await expeditionFor<{ eligible: boolean; reason?: string }>(
        page,
        POI_ROVINE,
        'checkEligibility',
        SLOT_ROVINE_LEADER,
        member.id,
      );
      expect(check.reason, `${member.id} deve essere rilasciato`).not.toBe('in-expedition');
    }
    const village = await expedition<VillageShape>(page, 'getVillage');
    const leader = village.residents.find((r) => r.id === VALID_LEADER)!;
    expect(Boolean(leader.isDead)).toBe(Boolean(terminal.party.find((m) => m.id === VALID_LEADER)?.dead));
    /* R-139: il settlement È il rientro — il flag `isOnExpedition` sullo
     *  store deve essere rilasciato per OGNI membro, vivo o morto. */
    for (const member of terminal.party) {
      const res = village.residents.find((r) => r.id === member.id)!;
      expect(res.isOnExpedition, `${member.id}: flag spedizione rilasciato`).toBeFalsy();
    }
  });

  // INV:CTR-game-008.INV-4
  test('chiusura del rapporto: il POI goblin RESTA — `repeatable`, run sganciata, riproponibile (R-200)', async ({ page }) => {
    await launchGoblinQuest(page);
    await driveRunToEnd(page);
    await waitForSettled(page);
    await flushBeatTheatre(page);
    await expect(closeReportButton(page)).toBeVisible();

    /* D-1: il report di un'offerta `repeatable` non consuma il POI — la run
     *  si sgancia e il marker torna `available` (stesso DOM id, il ghost
     *  exit non scatta perché l'anchor resta in lista). */
    await dismissQuestReport(page);
    await expect(questWindow(page)).toHaveCount(0);
    expect(await getRun(page)).toBeNull();
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('available');
    /* «Dopo il reward puoi rifarla»: il marker riapre il planner — la
     *  re-launch path è la stessa del primo ciclo. */
    await poiMarker(page).click();
    await expect(detail(page)).toBeVisible();
    /* Anche il marker rovine non è stato toccato. */
    await expect(page.locator(`[data-quest-poi-id="${POI_ROVINE}"]`)).toBeVisible({ timeout: 15_000 });
  });

  /* PLAN-019-S4 T-1+T-2 nel loop reale: la spedizione si chiude su un
   * rapporto ricco obbligatorio e il villaggio ha SCRITTO l'esito nel suo
   * journal persistito — non solo numeri mutati. */
  test('epilogo + journal: il rapporto ricco narra i destini e il villaggio ha scritto l\u2019esito', async ({ page }) => {
    await launchGoblinQuest(page);
    const terminal = await driveRunToEnd(page);
    await waitForSettled(page);
    await flushBeatTheatre(page);

    /* T-2: il rapporto ricco è obbligatorio — visibile insieme a «Chiudi». */
    const epilogue = page.getByTestId('quest-epilogue');
    await expect(epilogue).toBeVisible();
    await expect(closeReportButton(page)).toBeVisible();

    /* Le sezioni seguono i destini reali: caduti/feriti narrati solo se
     * accaduti; sul wipe nessuna sezione di resa (i morti sì — vanno pianti).
     * PLAN-067 T-C2/R-234: «who came back» vive nelle nicchie di
     * `QuestReturnedCrew` (`crew-niche-<id>` + `data-crew-state`), non più
     * come sezioni `dead`/`wounded` dell'epilogo (`crewShown` le rimuove). */
    const dead = terminal.party.filter((m) => m.dead);
    const wounded = terminal.party.filter((m) => !m.dead && m.wounded);
    for (const m of dead) {
      await expect(page.getByTestId(`crew-niche-${m.id}`)).toHaveAttribute('data-crew-state', 'fallen');
    }
    for (const m of wounded) {
      await expect(page.getByTestId(`crew-niche-${m.id}`)).toHaveAttribute('data-crew-state', 'wounded');
    }
    for (const m of terminal.party.filter((x) => !x.dead && !x.wounded)) {
      await expect(page.getByTestId(`crew-niche-${m.id}`)).toHaveAttribute('data-crew-state', 'returned');
    }
    if (terminal.outcome === 'wipe') {
      await expect(epilogue.locator('[data-epilogue-section="reward"]')).toHaveCount(0);
      await expect(epilogue.locator('[data-epilogue-section="xp"]')).toHaveCount(0);
    }
    if (terminal.outcome === 'reward') {
      await expect(epilogue.locator('[data-epilogue-section="reward"]')).toBeVisible();
    }
    if ((terminal.xp ?? 0) > 0) {
      await expect(epilogue.locator('[data-epilogue-section="xp"]')).toBeVisible();
    }

    /* T-1: il journal del villaggio ha narrato l'esito — headline +
     * una voce per destino, sullo stesso ledger deduplicato degli effetti. */
    const log = await expedition<EventLogShape[]>(page, 'getEventLog');
    const questEntries = log.filter((e) => e.messageKey?.startsWith('gameFrame.questLog.'));
    expect(
      questEntries.some((e) => e.messageKey === `gameFrame.questLog.outcome.${terminal.outcome}`),
      `headline outcome.${terminal.outcome} narrata nel journal`,
    ).toBe(true);
    for (const m of dead) {
      expect(
        questEntries.some((e) => e.messageKey === 'gameFrame.questLog.residentDead' && e.residentId === m.id),
        `residentDead narrata per ${m.id}`,
      ).toBe(true);
    }
    for (const m of wounded) {
      expect(
        questEntries.some((e) => e.messageKey === 'gameFrame.questLog.residentWounded' && e.residentId === m.id),
        `residentWounded narrata per ${m.id}`,
      ).toBe(true);
    }

    /* Il loop si chiude: il rapporto si chiude → la run si sgancia e il
     *  POI `repeatable` torna `available` (R-200 — mai consumato). */
    await dismissQuestReport(page);
    await expect(questWindow(page)).toHaveCount(0);
    expect(await getRun(page)).toBeNull();
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('available');
  });

  // INV:CTR-game-008.INV-4
  test('il POI `repeatable` torna dopo reload: run sganciata, marker di nuovo available', async ({ page }) => {
    await launchGoblinQuest(page);
    await driveRunToEnd(page);
    await waitForSettled(page);
    await flushBeatTheatre(page);
    await dismissQuestReport(page);
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('available');

    await page.reload();
    await waitForHooks(page);
    /* R-200: nessun record consumato è stato scritto — il marker torna via
     *  auto-reveal (o il reveal forzato) anche dopo un reload. */
    await revealQuestPois(page);
    expect(await poiStatus(page)).toBe('available');
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

  test('Director «start goblin quest»: stessa pipeline canonica — settle, HUD, ritorno POI available, reload', async ({ page }) => {
    /* Il Director è uno strumento dev/playwright (F10). Da quando punta a
     *  `demoLaunch`, il bottone attraversa la STESSA `send()` del click su
     *  «Invia spedizione» (offer freeze, party re-validato, riserva
     *  loadout): questa prova porta quella run fino al consumo del POI —
     *  l'equivalenza end-to-end, non solo «la finestra si apre». */
    const villageBefore = await expedition<VillageShape>(page, 'getVillage');
    const goldReadoutBefore = await goldReadoutValue(page);

    await page.keyboard.press('F10');
    await expect(page.getByTestId('director-panel')).toBeVisible({ timeout: 10_000 });
    /* R-143: reveal via il VERO toggle Director — «Mostra quest» è l'unico
     *  gate UI dei POI reali (goblin + rovine); un marker quest non è mai un
     *  esemplare demo («POI types» tiene solo job/event finti). */
    await page.locator('[data-action-id="quest"]').click();
    /* Stesso gate di revealQuestPois: il layer nasce visibility:hidden finché
     *  la camera Pixi non completa l'init — sotto carico supera i 15s. */
    await expect(page.getByTestId('pixi-world-anchors')).toBeVisible({ timeout: 60_000 });
    await expect(poiMarker(page)).toBeVisible({ timeout: 15_000 });
    await page.locator('[data-action-id="questRun"]').click();
    await page.keyboard.press('F10'); // ripiega il pannello: non deve coprire il report

    /* demoLaunch assegna i primi residenti eleggibili ai soli slot
     *  required (goblin: il solo leader), poi varca il vero send(). */
    await page.waitForFunction(
      (pid) => {
        const exp = (window as TestHooksWindow).__idleVillageTestHooks?.expedition?.[pid] as
          | { getRun?: () => { ended?: boolean } | null }
          | undefined;
        const r = exp?.getRun?.();
        return Boolean(r && !r.ended);
      },
      POI,
      { timeout: 20_000 },
    );
    await expect(questWindow(page)).toBeVisible({ timeout: 10_000 });
    await expect(detail(page)).toHaveCount(0);
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('in_progress');

    const run = (await getRun(page))!;
    expect(run.nodeId.startsWith('gob-')).toBe(true);
    /* Party reale: ogni membro è un residente del roster seedato — nessun
     *  preset può materializzarsi qui. */
    const rosterIds = new Set(villageBefore.residents.map((r) => r.id));
    expect(run.party.length).toBeGreaterThan(0);
    for (const m of run.party) expect(rosterIds.has(m.id)).toBe(true);

    const terminal = await driveRunToEnd(page);
    expect(terminal.ended).toBe(true);
    await flushBeatTheatre(page);
    await waitForSettled(page);
    const settlement = await expedition<SettlementShape | null>(page, 'getSettlement');
    expect(settlement?.status).toBe('settled');
    expect(settlement?.plan.outcome).toBe(terminal.outcome);

    /* Stesso contratto di ricompensa del path POI: delta esatto nello
     *  store e nel readout HUD del ribbon. */
    const villageAfter = await expedition<VillageShape>(page, 'getVillage');
    const expectedGold = expectedGoldDelta(terminal);
    expect(villageAfter.gold - villageBefore.gold).toBe(expectedGold);
    expect((await goldReadoutValue(page)) - goldReadoutBefore).toBe(expectedGold);

    /* E il POI `repeatable` si comporta come per una quest lanciata dal
     *  marker: chiuso il rapporto la run si sgancia e il marker torna
     *  `available` — mai consumato (R-200). */
    await dismissQuestReport(page);
    await expect(questWindow(page)).toHaveCount(0);
    expect(await getRun(page)).toBeNull();
    await expect.poll(async () => poiStatus(page), { timeout: 10_000 }).toBe('available');

    await page.reload();
    await waitForHooks(page);
    await revealQuestPois(page);
    expect(await poiStatus(page)).toBe('available');
    expect(await getRun(page)).toBeNull();
  });
});
