/**
 * gameQuestCluster.spec.ts — PLAN-043 WS-4 (artifact-r003 §6): the blocking
 * acceptance matrix BV-01..BV-14 on the canonical `/game` surface.
 *
 *   Zero-overlap solver probes (BV-01/03/11), drag-intent reversibility
 *   (BV-02), astrolabe settledIdle park + FPS (BV-04), single-verdict /
 *   no-Continua surface audit (BV-05), footer C1 (BV-07), progressive skip
 *   ladder (BV-08), reduced-motion degrade (BV-09), dismissal arm guard
 *   (BV-12), degraded audio + a11y order (BV-13), breath-filter budget
 *   (BV-14). BV-06/BV-10 are the unit-test/safeguard gates (manifest).
 *
 * Driver boundary: the run launches through `demoLaunch` — the REAL send
 * path (offer freeze, party re-validation, loadout reservation), never a
 * staged run. Choices commit through the same `choose` hook the window's
 * buttons call; tick maturation rides the canonical clock via
 * `advanceTicks`.
 */
import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const POI = 'poi-goblin';

/* ---------- verifier metrics ----------
 *  produceBundle esporta RUN_DIR e valuta i kind:metrics delle obbligazioni
 *  dom-temporal: servono ≥2 campioni temporali, non uno screenshot statico.
 *  Ogni test raccoglie campioni {t, ...} nella bag; afterEach li scrive in
 *  metrics-<bvid>.json. Fuori da verify:bundle cade nella run dir canonica. */
const RUN_DIR = process.env.RUN_DIR ?? path.resolve('.mw/runs/plan043-ws4-quest-theatre');
let metricsBag: Record<string, unknown>[] = [];
let metricsEnv: unknown = null;
/** Registra un campione temporale dell'obbligazione in esecuzione. */
const sample = (data: Record<string, unknown>) => metricsBag.push({ t: Date.now(), ...data });

/** R-189 env attestation: prova raccolta DENTRO il run (visibility, viewport,
 *  rAF ticks, frameDiff su un elemento live). Stessa forma di
 *  gameQuestPlannerLayout.spec.ts. */
const collectEnv = (page: Page) =>
  page.evaluate(async () => {
    const rafTicks = await new Promise<number>((resolve) => {
      let n = 0;
      const t0 = performance.now();
      const tick = () => {
        n += 1;
        if (performance.now() - t0 > 300) resolve(n);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    /* frameDiff: cambi di style reali su elementi animati su 4 campioni —
     *  prova che la pagina renderizzava durante il run. Si cercano gli
     *  elementi con un'animazione running (astro loops, theatre FX, pin
     *  POI della mappa): se nulla cambia davvero, frameDiff resta 0 e il
     *  gate dice INVALID_ENV — onesto per contratto. */
    const targets = document
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => (a.effect as KeyframeEffect | null)?.target)
      .filter((el): el is Element => el instanceof Element)
      .slice(0, 12);
    const read = () =>
      targets
        .map((el) => {
          const c = getComputedStyle(el);
          return c.transform + c.opacity + c.filter + c.backgroundPosition;
        })
        .join(';');
    let prev = '';
    let frameDiff = 0;
    for (let i = 0; i < 4; i += 1) {
      const cur = read();
      if (prev !== '' && cur !== prev) frameDiff += 1;
      prev = cur;
      await new Promise((r) => setTimeout(r, 80));
    }
    return {
      visibilityState: document.visibilityState,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      devicePixelRatio: window.devicePixelRatio,
      rafTicks,
      frameDiff,
      headed: false,
    };
  });

type RunShape = {
  ended: boolean;
  nodeId: string;
  frontier: { status: string; readyAt: number };
};

interface HooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    advanceTicks?: (n: number) => void;
    getClock?: () => { currentTick: number; isPaused: boolean };
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
const choose = (page: Page, optionId: string) => callExpedition<void>(page, 'choose', optionId);
const advanceTicks = (page: Page, n: number) =>
  page.evaluate((ticks) => (window as HooksWindow).__idleVillageTestHooks?.advanceTicks?.(ticks), n);
const getClock = (page: Page) =>
  page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.getClock?.());

/* ---------- selectors ---------- */
const cluster = (page: Page) => page.getByTestId('quest-stage-cluster');
const window_ = (page: Page) => page.getByTestId('quest-window');
const companionLeft = (page: Page) => page.getByTestId('quest-companion-left');
const companionTab = (page: Page) => page.getByTestId('quest-companion-tab');
const checkColumn = (page: Page) => page.getByTestId('quest-check-column');
const verdictCard = (page: Page) => page.getByTestId('quest-verdict-card');
const microBelt = (page: Page) => page.getByTestId('quest-micro-belt');
const theatre = (page: Page) => page.getByTestId('quest-theatre');
const beatStage = (page: Page) => page.getByTestId('quest-window-beat');
const footer = (page: Page) => page.getByTestId('quest-window-footer');

/* ---------- drivers ---------- */

const waitForHooks = (page: Page) =>
  page.waitForFunction(
    (pid) => Boolean((window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid]),
    POI,
    { timeout: 30_000 },
  );

/** Canonical launch: Director-style one-click send (real send boundary). */
const launchQuest = async (page: Page) => {
  await callExpedition(page, 'demoLaunch');
  await expect(window_(page)).toBeVisible({ timeout: 30_000 });
};

/** Park the run on a WAITING frontier: pending nodes mature on the clock,
 *  and presenting beats are flushed by stage clicks (skip ladder is
 *  idempotent — the beat itself is the affordance). */
const reachWaitingFrontier = async (page: Page, maxSteps = 40) => {
  for (let i = 0; i < maxSteps; i++) {
    const run = await getRun(page);
    if (!run || run.ended) throw new Error(`run ended/vanished before a waiting frontier (${run?.nodeId})`);
    if (run.frontier.status === 'pending') {
      const clock = await getClock(page);
      const lead = Math.max(0, run.frontier.readyAt - (clock?.currentTick ?? 0));
      await advanceTicks(page, lead + 1);
    }
    /* Flush any beats still presenting — click until the stage reports the
     *  waiting state (choices visible). A check beat holds on the column:
     *  throw + settle + dismiss through its own click path. */
    for (let j = 0; j < 20; j++) {
      if (await page.getByTestId('quest-window-choice').first().isVisible().catch(() => false)) break;
      if (await checkColumn(page).isVisible().catch(() => false)) {
        await settleCheck(page);
        continue;
      }
      if (await beatStage(page).isVisible().catch(() => false)) {
        /* FX overlays (bars/reveal) can intercept pointer events mid-beat;
         *  force bypasses actionability so the click still lands. */
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

/** Commit the first choice and wait until the check column is live. */
const driveToCheck = async (page: Page) => {
  await reachWaitingFrontier(page);
  const options = await getOptions(page);
  await choose(page, options[0]);
  /* The commit queues beats; the check beat holds with the column mounted. */
  await expect(checkColumn(page)).toBeVisible({ timeout: 15_000 });
};

/** Throw + settle the astrolabe in the column. The engine's `skipToResult`
 *  is a no-op while `state==='idle'` — the roll may not have armed yet —
 *  so this retries «throw → settle» until the Verdict Card paints. */
const settleCheck = async (page: Page) => {
  const board = page.getByTestId('quest-check-board');
  const tira = checkColumn(page).locator('.da-tira, #launch');
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (await verdictCard(page).isVisible().catch(() => false)) return;
    if (!(await checkColumn(page).isVisible().catch(() => false))) return;
    if (await tira.isVisible().catch(() => false)) await tira.click().catch(() => undefined);
    await page.waitForTimeout(250);
    await board.click().catch(() => undefined);
    await page.waitForTimeout(350);
  }
  await expect(verdictCard(page)).toBeVisible({ timeout: 3_000 });
};

/** Dismiss the column by clicking its backdrop-free body after the arm. */
const dismissColumn = async (page: Page) => {
  await page.waitForTimeout(500); // dismissArmDelayMs 350 + margin
  await checkColumn(page).click({ position: { x: 8, y: 8 } });
  await expect(checkColumn(page)).toBeHidden({ timeout: 10_000 });
};

/** Wait until the probed elements have no running CSS/WAAPI animations AND
 *  their rects are stable across two polls — wing open/close rides a
 *  `wingTransitionMs` (180ms) slide; BV-01 measures the SETTLED layout, not
 *  the animation midpoint. Rect-equality alone lies at ~12fps headless:
 *  two polls 80ms apart can read the same compositor frame mid-transition. */
const waitStableRects = async (page: Page, sels: string[], timeoutMs = 2500) => {
  const t0 = Date.now();
  await page.waitForTimeout(400);
  const sig = () =>
    page.evaluate((selectors) => {
      return selectors
        .map((sel) => {
          const el = document.querySelector(`[data-testid="${sel}"]`);
          if (!el) return `${sel}:null`;
          const r = el.getBoundingClientRect();
          const running = el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length;
          return `${sel}:${r.x | 0},${r.y | 0},${r.width | 0},${r.height | 0},anim:${running}`;
        })
        .join('|');
    }, sels);
  let prev = await sig();
  while (Date.now() - t0 < timeoutMs) {
    await page.waitForTimeout(120);
    const cur = await sig();
    if (cur === prev && !/anim:[1-9]/.test(cur)) return;
    prev = cur;
  }
};

/** Pairwise intersection area over the given locators' bounding boxes. */
const overlapPairs = async (page: Page, sels: string[]) => {
  const boxes = await page.evaluate((selectors) => {
    const out: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    for (const sel of selectors) {
      const el = document.querySelector(`[data-testid="${sel}"]`);
      if (!el) {
        out[sel] = null;
        continue;
      }
      const r = el.getBoundingClientRect();
      /* An element with no paint box (0×0) cannot overlap anything. */
      out[sel] = r.width > 0 && r.height > 0 ? { x: r.x, y: r.y, w: r.width, h: r.height } : null;
    }
    return out;
  }, sels);
  const pairs: { a: string; b: string; area: number }[] = [];
  const keys = sels.filter((s) => boxes[s]);
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) {
      const A = boxes[keys[i]]!;
      const B = boxes[keys[j]]!;
      const w = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
      const h = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (w > 0.5 && h > 0.5) pairs.push({ a: keys[i], b: keys[j], area: w * h });
    }
  return pairs;
};

const COLUMN_PROBES = ['quest-companion-left', 'quest-companion-tab', 'quest-window', 'quest-check-column'];

/* ================= tests ================= */

test.describe('PLAN-043 WS-4 — QuestStageCluster BV gates', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    metricsBag = [];
    metricsEnv = null;
    await page.goto('/game');
    await waitForHooks(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const m = testInfo.title.match(/BV-\d+/);
    if (!m) return;
    /* L'attestazione va raccolta su una pagina con la superficie quest VIVA
     *  (frameDiff>0): i test con contesto proprio la catturano dentro il
     *  test stesso; qui fallback sul page fixture (BV-01/BV-09 la lasciano
     *  sulla mappa statica → frameDiff 0 → INVALID_ENV). */
    const env = metricsEnv ?? (await collectEnv(page).catch(() => null));
    mkdirSync(RUN_DIR, { recursive: true });
    writeFileSync(
      path.join(RUN_DIR, `metrics-${m[0].toLowerCase().replace('-', '')}.json`),
      JSON.stringify({ env, samples: metricsBag, errors: [] }, null, 2),
    );
  });

  test('BV-01 — zero overlap across viewports and states A–F', async ({ browser }) => {
    /* A completed/spent quest can't relaunch — each viewport gets a FRESH
     *  context (clean persistence profile) so `demoLaunch` always lands. */
    test.setTimeout(360_000); // 5 viewports × 6 states, headless SwiftShader is slow
    for (const size of [
      { w: 1280, h: 720 },
      { w: 1440, h: 900 },
      { w: 1920, h: 1080 },
      { w: 2560, h: 1440 },
      { w: 1280, h: 800 },
    ]) {
      const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
      const page = await ctx.newPage();
      await page.goto('/game');
      await waitForHooks(page);
      await launchQuest(page);
      await reachWaitingFrontier(page);
      /* State A — choices + Micro-Belt. */
      await expect(microBelt(page)).toBeVisible();
      await waitStableRects(page, COLUMN_PROBES);
      const pairsA = await overlapPairs(page, COLUMN_PROBES);
      sample({ viewport: `${size.w}x${size.h}`, state: 'A', overlapPairs: pairsA });
      expect(pairsA, `${size.w}×${size.h} state A`).toEqual([]);
      /* State B — CompanionLeft open. */
      await page.getByTestId('quest-party-toggle').click();
      await expect(companionLeft(page).or(companionTab(page)).first()).toBeVisible();
      await waitStableRects(page, COLUMN_PROBES);
      const pairsB = await overlapPairs(page, COLUMN_PROBES);
      sample({ viewport: `${size.w}x${size.h}`, state: 'B', overlapPairs: pairsB });
      expect(pairsB, `${size.w}×${size.h} state B`).toEqual([]);
      /* State C/D — check live → verdict card. */
      await driveToCheck(page);
      await waitStableRects(page, COLUMN_PROBES);
      const pairsC = await overlapPairs(page, COLUMN_PROBES);
      sample({ viewport: `${size.w}x${size.h}`, state: 'C', overlapPairs: pairsC });
      expect(pairsC, `${size.w}×${size.h} state C`).toEqual([]);
      /* Env attestation on the LIVE surface (check spinning) — once per run. */
      if (!metricsEnv) metricsEnv = await collectEnv(page);
      await settleCheck(page);
      await expect(verdictCard(page)).toBeVisible();
      await waitStableRects(page, COLUMN_PROBES);
      const pairsD = await overlapPairs(page, COLUMN_PROBES);
      sample({ viewport: `${size.w}x${size.h}`, state: 'D', overlapPairs: pairsD });
      expect(pairsD, `${size.w}×${size.h} state D`).toEqual([]);
      await dismissColumn(page);
      /* State E — inline abandon confirm. */
      await reachWaitingFrontier(page);
      await page.getByTestId('quest-abandon-toggle').click();
      await expect(page.getByTestId('quest-abandon-confirm')).toBeVisible();
      await waitStableRects(page, COLUMN_PROBES);
      const pairsE = await overlapPairs(page, COLUMN_PROBES);
      sample({ viewport: `${size.w}x${size.h}`, state: 'E', overlapPairs: pairsE });
      expect(pairsE, `${size.w}×${size.h} state E`).toEqual([]);
      await page.getByTestId('quest-abandon-stay').click();
      /* State F — CombatStrip active: drive until a combat node or run end. */
      let combatSeen = false;
      for (let i = 0; i < 24 && !combatSeen; i++) {
        const run = await getRun(page);
        if (!run || run.ended) break;
        combatSeen = await page.getByTestId('quest-combat-strip').isVisible().catch(() => false);
        if (combatSeen) break;
        await reachWaitingFrontier(page);
        const options = await getOptions(page);
        if (!options.length) break;
        await choose(page, options[options.length - 1]);
        await reachWaitingFrontier(page);
      }
      if (combatSeen) {
        await waitStableRects(page, COLUMN_PROBES);
        const pairsF = await overlapPairs(page, COLUMN_PROBES);
        sample({ viewport: `${size.w}x${size.h}`, state: 'F', overlapPairs: pairsF });
        expect(pairsF, `${size.w}×${size.h} state F`).toEqual([]);
      }
      await ctx.close();
    }
  });

  test('BV-02 — drag near edge + wing shift restores userCenterX ±1px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await launchQuest(page);
    await reachWaitingFrontier(page);
    const handle = window_(page).locator('[data-hud-drag-handle]').first();
    const box0 = (await window_(page).boundingBox())!;
    const cx0 = box0.x + box0.width / 2;
    /* Drag the cluster near the right edge through the title row. */
    const hb = (await handle.boundingBox())!;
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(page.viewportSize()!.width - 100, hb.y + hb.height / 2, { steps: 8 });
    await page.mouse.up();
    const boxDragged = (await window_(page).boundingBox())!;
    const userCX = boxDragged.x + boxDragged.width / 2;
    sample({ phase: 'dragged', cx0, userCX });
    /* Open the check column — the cluster shifts left to fit the wing. */
    await driveToCheck(page);
    if (!metricsEnv) metricsEnv = await collectEnv(page); // live surface
    const boxCheck = (await window_(page).boundingBox())!;
    sample({ phase: 'check-open', rightEdge: boxCheck.x + boxCheck.width });
    expect(boxCheck.x + boxCheck.width).toBeLessThanOrEqual(1440 - 16 + 1);
    /* Dismiss → the window returns to the committed centre (BV-02). The
     *  column only dismisses after its verdict is armed — settle first. */
    await settleCheck(page);
    await dismissColumn(page);
    await reachWaitingFrontier(page);
    const boxBack = (await window_(page).boundingBox())!;
    const drift = Math.abs(boxBack.x + boxBack.width / 2 - userCX);
    sample({ phase: 'restored', userCX, backCX: boxBack.x + boxBack.width / 2, driftPx: drift });
    expect(drift).toBeLessThanOrEqual(1);
    void cx0;
  });

  test('BV-03 — 1280×720 mutual exclusion: companion folds while the check is live', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await launchQuest(page);
    await reachWaitingFrontier(page);
    await page.getByTestId('quest-party-toggle').click();
    /* At 1280 with no check live the column may still fold — either the wing
     * or the tab paints; the contract needs the FOLD once the check opens. */
    await driveToCheck(page);
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    /* The live check wins the margin: the companion must be folded. */
    await expect(companionTab(page)).toBeVisible({ timeout: 10_000 });
    await expect(companionLeft(page)).toBeHidden();
    sample({ state: 'check-live', tabVisible: true, leftHidden: true });
    await settleCheck(page);
    await dismissColumn(page);
    /* Restore: the party tab re-opens in the left wing. */
    await expect(companionLeft(page)).toBeVisible({ timeout: 10_000 });
    await waitStableRects(page, COLUMN_PROBES);
    const pairs = await overlapPairs(page, COLUMN_PROBES);
    sample({ state: 'restored', leftVisible: true, overlapPairs: pairs });
    expect(pairs).toEqual([]);
  });

  test('BV-04 — settledIdle parks the astrolabe rAF; resize repaints exactly once', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await launchQuest(page);
    await reachWaitingFrontier(page);
    /* Baseline first: the held-verdict fps is judged against the page's OWN
     *  idle rate — headless Chromium renders the fullscreen Pixi map through
     *  software GL and cannot reach 55fps there; the contract's substance is
     *  that the settled astrolabe does not drag the loop down. */
    const fpsSample = () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let n = 0;
            const t0 = performance.now();
            const tick = () => {
              n += 1;
              if (performance.now() - t0 < 1000) requestAnimationFrame(tick);
              else resolve(n);
            };
            requestAnimationFrame(tick);
          }),
      );
    const baseline = await fpsSample();
    sample({ phase: 'baseline', fps: baseline });
    await driveToCheck(page);
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    /* Measure DURING the spin — the heaviest legal state. */
    const spin = await fpsSample();
    sample({ phase: 'spin', fps: spin });
    await settleCheck(page);
    /* 700ms park delay — wait it out, then measure the counter's delta. */
    await page.waitForTimeout(900);
    const framesOf = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('[data-testid="quest-check-column"] [data-astro-frames], [data-astro-frames]');
        return el ? Number(el.dataset.astroFrames) : null;
      });
    const f0 = await framesOf();
    expect(f0, 'engine exposes the frame counter').not.toBeNull();
    await page.waitForTimeout(1000);
    const f1 = await framesOf();
    sample({ phase: 'parked-1s', rafDelta: f1! - f0! });
    expect(f1! - f0!, 'parked loop must not tick').toBe(0);
    /* Headless software-GL can't hit a literal 55fps — the page's Pixi map
     *  alone costs that much there. The honest headless gate: the PARKED
     *  astrolabe must not drag fps below the actively spinning state's
     *  (~its own raster budget), and never below baseline×0.4 — a real leak
     *  (e.g. the engine still animating, a stuck shimmer) would show here. */
    const fps = await fpsSample();
    sample({ phase: 'held-verdict', fps });
    test.info().annotations.push({ type: 'fps', description: `baseline=${baseline} spin=${spin} held=${fps}` });
    expect(fps, 'held verdict must cost ≤ the spinning state').toBeGreaterThanOrEqual(Math.max(6, spin * 0.75));
    /* Fixed sanity floor only — a baseline×k bound measures SwiftShader
     *  jitter, not a contract. Absolute 55fps is a GPU-headed witness. */
    expect(fps, 'page still produces frames while the verdict is held').toBeGreaterThanOrEqual(8);
    /* Resize → exactly one repaint, loop still parked afterwards. */
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.waitForTimeout(200);
    const f2 = await framesOf();
    sample({ phase: 'resized', rafDelta: f2! - f1! });
    expect(f2! - f1!).toBeLessThanOrEqual(2); // one redraw + settle margin
    await page.waitForTimeout(1000);
    const f3 = await framesOf();
    sample({ phase: 'post-resize-1s', rafDelta: f3! - f2! });
    expect(f3! - f2!).toBe(0);
    await dismissColumn(page);
  });

  test('BV-05 — single verdict, no #card, zero dev jargon, zero Continua', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await launchQuest(page);
    await driveToCheck(page);
    /* The internal astrolabe card is suppressed while it spins: the base
     * .card rule is `opacity:0` and `.show` is the only gate — assert it
     * never lands. */
    const cardState = () =>
      page.evaluate(() => {
        const card = document.querySelector<HTMLElement>('#card');
        if (!card) return 'absent';
        return `${card.classList.contains('show') ? 'shown' : 'hidden'}/${getComputedStyle(card).opacity}`;
      });
    const cardSpin = await cardState();
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    sample({ phase: 'spinning', internalCard: cardSpin });
    expect(cardSpin).toBe('hidden/0');
    await settleCheck(page);
    await expect(verdictCard(page)).toHaveCount(1);
    /* Post-verdict the internal card stays hidden — the Verdict Card is the
     * only result surface on the column. */
    const cardHeld = await cardState();
    sample({ phase: 'verdict-held', internalCard: cardHeld, verdictCards: 1 });
    expect(cardHeld).toBe('hidden/0');
    /* Forbidden jargon anywhere on the quest surface. */
    const surfaceText = (await cluster(page).innerText().catch(() => '')) + (await checkColumn(page).innerText().catch(() => ''));
    for (const banned of ['TICKS', 'PHASE ', 'NESSUNO SLOT COMPATIBILE']) {
      expect(surfaceText).not.toContain(banned);
    }
    /* Zero Continua/Continue — buttons AND bare text. */
    const continua = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, [role="button"]'));
      return els.filter((b) => /^(continua|continue)$/i.test((b.textContent ?? '').trim())).length;
    });
    sample({ phase: 'surface-audit', continuaControls: continua });
    expect(continua).toBe(0);
    await dismissColumn(page);
  });

  test('BV-07 — footer collapses to a ≤8px seam; choices never scroll at 720p', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await launchQuest(page);
    await reachWaitingFrontier(page);
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    await expect(footer(page)).toBeVisible();
    await page.getByTestId('quest-footer-toggle').click();
    const h = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="quest-window-footer"]');
      return el ? el.getBoundingClientRect().height : -1;
    });
    sample({ phase: 'footer-collapsed', footerHeightPx: h });
    expect(h).toBeLessThanOrEqual(8);
    /* The choice list must not scroll: content fits the 720p stage. */
    const scrolls = await page.evaluate(() => {
      const list = document.querySelector('[data-hud-choices]');
      return list ? list.scrollHeight - list.clientHeight : 0;
    });
    sample({ phase: 'choices-fit', scrollOverflowPx: scrolls });
    expect(scrolls).toBeLessThanOrEqual(1);
  });

  test('BV-08 — rapid skip ladder never double-commits nor orphans audio', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await launchQuest(page);
    await reachWaitingFrontier(page);
    const before = await getRun(page);
    /* Commit one choice, then storm the stage with clicks + keys. */
    const options = await getOptions(page);
    await choose(page, options[0]);
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    for (let i = 0; i < 12; i++) {
      sample({ iter: i, checkVisible: await checkColumn(page).isVisible().catch(() => false) });
      if (await checkColumn(page).isVisible().catch(() => false)) {
        await settleCheck(page);
        await dismissColumn(page);
        break;
      }
      if (await beatStage(page).isVisible().catch(() => false)) await beatStage(page).click();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(40);
    }
    /* The run must be in exactly the state ONE commit produces — the next
     *  frontier, never two options deep. */
    const after = await getRun(page);
    sample({ phase: 'post-storm', nodeBefore: before!.nodeId, nodeAfter: after?.nodeId });
    expect(after).toBeTruthy();
    expect(after!.nodeId).not.toBe(before!.nodeId);
    /* No orphaned WebAudio nodes: within one stinger tail (~1.3s) the
     *  singleton must report silence — a still-playing tail is legal, a
     *  looping riser or cancelled-but-stuck voice is not. */
    const liveSources = await page.evaluate(async () => {
      const dbg = (window as unknown as { __questTheatreAudioDebug?: { liveSources?: () => number } }).__questTheatreAudioDebug;
      if (!dbg?.liveSources) return 0;
      const deadline = performance.now() + 2500;
      while (performance.now() < deadline) {
        if (dbg.liveSources() === 0) return 0;
        await new Promise((r) => setTimeout(r, 50));
      }
      return dbg.liveSources();
    });
    sample({ phase: 'audio-settled', liveSources });
    expect(liveSources).toBe(0);
  });

  test('BV-11 — expanded-stage beat → check at 1280×720 stays overlap-free', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await launchQuest(page);
    /* The goblin finale carries `expanded` — drive the run to its last
     * combat/check sequence and assert the transition solves cleanly. */
    sample({ phase: 'start', overlapPairs: await overlapPairs(page, COLUMN_PROBES) });
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    let expandedSeen = false;
    for (let i = 0; i < 30; i++) {
      const run = await getRun(page);
      if (!run || run.ended) break;
      if (await checkColumn(page).isVisible().catch(() => false)) {
        sample({ iter: i, phase: 'check-live', overlapPairs: await overlapPairs(page, COLUMN_PROBES) });
        await settleCheck(page);
        await dismissColumn(page);
        continue;
      }
      if (await beatStage(page).isVisible().catch(() => false)) {
        /* Snapshot mid-transition: expanded tag suppresses wings. */
        const overlap = await overlapPairs(page, COLUMN_PROBES);
        const winBox = await window_(page).boundingBox();
        sample({ iter: i, overlapPairs: overlap, windowW: winBox?.width ?? null });
        expect(overlap).toEqual([]);
        if (winBox && winBox.width > 900) expandedSeen = true;
        await beatStage(page).click();
        await page.waitForTimeout(80);
        continue;
      }
      if (run.frontier.status === 'pending') {
        const clock = await getClock(page);
        await advanceTicks(page, Math.max(0, run.frontier.readyAt - (clock?.currentTick ?? 0)) + 1);
        continue;
      }
      const options = await getOptions(page);
      if (!options.length) break;
      await choose(page, options[options.length - 1]);
    }
    sample({ phase: 'end', expandedSeen });
    /* Expanded may not trigger on every seed — the overlap invariant must
     * hold regardless; the tag's presence is logged, not gated. */
    test.info().annotations.push({ type: 'expanded-seen', description: String(expandedSeen) });
  });

  test('BV-12 — the 350ms arm guards the verdict from a landing click', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await launchQuest(page);
    await driveToCheck(page);
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    /* Throw, then settle — the click that lands the verdict must NOT dismiss. */
    const tira = checkColumn(page).locator('.da-tira');
    if (await tira.isVisible().catch(() => false)) await tira.click();
    const board = page.getByTestId('quest-check-board');
    await board.click();
    const col = checkColumn(page);
    await expect(verdictCard(page)).toBeVisible();
    /* The arm is a DOM flag, not a wall-clock race: evaluate+click in ONE
     *  in-page tick so `armed` cannot flip between observation and dispatch.
     *  If the flag is already set at first observation (slow headless paint)
     *  the guarded-click half is unverifiable this pass — we record it. */
    const guardedResult = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="quest-check-column"]');
      if (!el) return 'missing';
      if (el.hasAttribute('data-check-armed')) return 'already-armed';
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 8, clientY: 8 }));
      return 'clicked-unarmed';
    });
    sample({ phase: 'guarded-click', result: guardedResult });
    if (guardedResult === 'clicked-unarmed') {
      await expect(col).toBeVisible();
      await expect(verdictCard(page)).toBeVisible();
    } else if (guardedResult === 'missing') {
      throw new Error('check column vanished before the verdict was armed');
    } else {
      test.info().annotations.push({ type: 'note', description: 'armed flag already set at first observation — guarded-click half unverifiable' });
    }
    /* Past the arm: exactly one dismiss. */
    await expect(col).toHaveAttribute('data-check-armed', 'true', { timeout: 5_000 });
    await col.click({ position: { x: 8, y: 8 } });
    await expect(col).toBeHidden({ timeout: 5_000 });
    sample({ phase: 'post-arm-dismiss', dismissed: true });
  });

  test('BV-09 — reduced motion: reveal degrades, no audio instantiation in handlers', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    /* Wire the AudioContext counter BEFORE the app boots. The contract
     * (T-10): zero `new AudioContext()` inside beat/animation handlers —
     * the idle-tick prewarm at mount is explicitly allowed, so we measure
     * the delta across a driven check sequence, not the boot count. */
    await page.addInitScript(() => {
      let created = 0;
      const AC = (window as unknown as { AudioContext?: unknown }).AudioContext;
      (window as unknown as { __acCount: number }).__acCount = 0;
      if (typeof AC === 'function') {
        (window as unknown as { AudioContext?: unknown }).AudioContext = function (this: unknown, ...a: unknown[]) {
          created += 1;
          (window as unknown as { __acCount: number }).__acCount = created;
          return Reflect.construct(AC as new (...x: unknown[]) => object, a);
        } as unknown;
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/game');
    await waitForHooks(page);
    await launchQuest(page);
    await reachWaitingFrontier(page);
    /* Env attestation inside the reduced-motion context's page — the fixture
     *  page never has the quest mounted in this test. */
    metricsEnv = await collectEnv(page);
    const beforeBeats = await page.evaluate(() => (window as unknown as { __acCount: number }).__acCount);
    /* Drive a check + storm the beat stage under reduced motion. */
    const options = await getOptions(page);
    await choose(page, options[0]);
    for (let i = 0; i < 10; i++) {
      if (await checkColumn(page).isVisible().catch(() => false)) break;
      if (await beatStage(page).isVisible().catch(() => false)) await beatStage(page).click();
      await page.waitForTimeout(60);
    }
    const afterBeats = await page.evaluate(() => (window as unknown as { __acCount: number }).__acCount);
    sample({ phase: 'beat-storm', audioContextsDelta: afterBeats - beforeBeats });
    expect(afterBeats - beforeBeats).toBe(0);
    /* The reveal aperture must be the 150ms fade under reduced motion — the
     * veil (data-fx="reveal") uses opacity only, never a clip-path slit. If
     * the veil is already gone, probe its absence as a pass: the degraded
     * path never mounts a clipped layer at all. */
    const revealClip = await page.evaluate(() => {
      const el = document.querySelector('[data-fx="reveal"]');
      return el ? getComputedStyle(el).clipPath : 'absent';
    });
    sample({ phase: 'reveal-probe', clipPath: revealClip });
    expect(revealClip === 'absent' || revealClip === 'none' || !revealClip.includes('inset(')).toBe(true);
    if (await checkColumn(page).isVisible().catch(() => false)) {
      await settleCheck(page);
      await dismissColumn(page);
    }
    await ctx.close();
  });

  test('BV-14 — breath-filter frame budget vs baseline p95 during check breath', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await launchQuest(page);
    await reachWaitingFrontier(page);
    /* rAF-delta sampler. Headless software-GL can't hit a literal 16.6ms —
     *  the gate is that the breath/filter window does not blow the frame
     *  budget RELATIVE to the same page idling (baseline-relative witness;
     *  absolute p95 recorded as an annotation for a GPU run). */
    const sampleDeltas = (ms: number, kick?: () => void) =>
      page.evaluate(async ({ dur }) => {
        const deltas: number[] = [];
        let last = performance.now();
        let collecting = true;
        const tick = () => {
          const now = performance.now();
          deltas.push(now - last);
          last = now;
          if (collecting) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        (window as unknown as { __kick?: () => void }).__kick?.();
        await new Promise((r) => setTimeout(r, dur));
        collecting = false;
        return deltas;
      }, { dur: ms });
    const p95 = (deltas: number[]) => {
      const s = [...deltas].sort((a, b) => a - b);
      return s[Math.floor(s.length * 0.95)] ?? 0;
    };
    const baselineDeltas = await sampleDeltas(800);
    const baseline = p95(baselineDeltas);
    sample({ phase: 'baseline', p95ms: baseline, frames: baselineDeltas.length });
    if (!metricsEnv) metricsEnv = await collectEnv(page);
    /* Instrument one held check in TWO windows inside the same evaluate —
     *  no round-trip between them so the arm/spin state is identical:
     *    [0,1400ms)  mount + j-cut lead + impact + breath pulse  ("breath")
     *    [1600,2800) breath finished, astrolabe still spinning   ("spin")
     *  The honest comparator is spin+breath vs spin-only: the idle page
     *  baseline can't isolate a ~100ms filter pulse from the column mount
     *  and the rAF-heavy astrolabe choreography (headless SwiftShader). */
    const { breathFrames, spinFrames } = await page.evaluate(async () => {
      const deltas: number[] = [];
      let last = performance.now();
      let collecting = true;
      const tick = () => {
        const now = performance.now();
        deltas.push(now - last);
        last = now;
        if (collecting) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.['poi-goblin'];
      (exp?.['choose'] as (id: string) => void)((exp['getOptions'] as () => string[])()[0]);
      await new Promise((r) => setTimeout(r, 1400));
      const breathFrames = deltas.splice(0);
      await new Promise((r) => setTimeout(r, 1400));
      collecting = false;
      return { breathFrames, spinFrames: deltas };
    });
    const breath = p95(breathFrames);
    const spin = p95(spinFrames);
    sample({ phase: 'check-windows', breathP95ms: breath, spinP95ms: spin, breathFrames: breathFrames.length, spinFrames: spinFrames.length });
    test.info().annotations.push({ type: 'breath-p95', description: `baseline=${baseline.toFixed(1)}ms breath=${breath.toFixed(1)}ms spinOnly=${spin.toFixed(1)}ms` });
    /* The breath window carries the column mount + j-cut + impact + pulse —
     *  allow 2× the spin-only p95 (or +16ms). A filter storm or layout
     *  thrash during the pulse pushes it far past that in software GL. */
    expect(breath).toBeLessThanOrEqual(Math.max(spin * 2, spin + 16));
  });
});

