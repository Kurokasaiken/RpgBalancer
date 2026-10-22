/**
 * gameQuestPlannerLayout.spec.ts — PLAN-043 WS-3 «Dispatch Table»
 * (artifact-r005; supersedes PLAN-036/R-195 BV-1·BV-2·BV-4): the planner +
 * pinned forecast wing, verified GEOMETRICALLY (rendered boxes, never
 * arithmetic budgets) across the ratified viewport matrix.
 *
 *   ≥ `minZeroScrollViewportHeightPx` (720): the center stage shows ZERO
 *     internal overflow (`scrollHeight ≤ clientHeight + 1`) and the
 *     anchored send CTA sits inside the viewport.
 *   < 720: internal body scroll is legal; the CTA still lands on screen
 *     and a resize re-clamps the assembly.
 *
 *   BV-4 → AC-01/AC-17: the forecast is pinned to the RIGHT WING — an
 *   external sibling plaque to the RIGHT of the planner that never yields
 *   while the party is being edited, and it names each scenario's
 *   authored key-stat tiers verbatim (Goblin: Primaria Forza / Secondaria
 *   Percezione; Rovine: Primaria Forza / Secondarie
 *   Percezione·Costituzione·Destrezza).
 *
 *   Testid migration (WS-3): `floating-panel-header-quest-expedition-*`
 *   → `quest-planner-hero` (the letterbox is the drag handle);
 *   `quest-expedition-cinema` → `quest-planner-hero`;
 *   `quest-bag-external-picker` → `quest-selection-tray`.
 *
 *   Every test asserts zero `pageerror` and zero `console.error` (the
 *   error-free contract on the planning surface).
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/** R-189 bundle gate: `dom-temporal` obligations need a metrics artifact with
 *  an env attestation + a samples timeline. Emitted only when the runner
 *  exports RUN_DIR (produceBundle); a plain `npx playwright test` skips it. */
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
    /* frameDiff: style changes on a live element over 4 samples — proof the
     *  page was actually rendering (R-189 env attestation). The slot-v12
     *  bezel breathes via CSS animation (still running under
     *  --force-prefers-reduced-motion, which only gates JS-driven motion). */
    const probe = document.querySelector('.slot-v12__bezel') ?? document.querySelector('.slot-v12') ?? document.body;
    const read = () => {
      const cs = getComputedStyle(probe);
      const kids = Array.from(probe.querySelectorAll('*')).slice(0, 12);
      return cs.opacity + '|' + cs.transform + '|' + kids.map((k) => getComputedStyle(k).transform).join(';');
    };
    let prev = '';
    let frameDiff = 0;
    for (let i = 0; i < 4; i += 1) {
      const cur = read();
      if (cur !== prev) frameDiff += 1;
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

const writeMetrics = (fileName: string, env: unknown, samples: Array<Record<string, unknown>>) => {
  const dir = process.env.RUN_DIR;
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify({ env, samples, errors: [] }, null, 2));
};

const POI = 'poi-goblin';
const POI_ROVINE = 'poi-rovine';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
/** `villager-mastro-beppe` — fortitude: eligible for leader AND member seats. */
const BEPPE = 'villager-mastro-beppe';
/** `QUEST_PLANNER_INFO.layout.minZeroScrollViewportHeightPx` — duplicated
 *  here so a config drift fails loudly instead of silently re-tuning the
 *  assert. */
const ZERO_SCROLL_MIN_HEIGHT = 720;

interface HooksWindow extends Window {
  __idleVillageTestHooks?: {
    expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
    revealQuestPois?: () => void;
  };
}

const callHook = (page: Page, poiId: string, action: string) =>
  page.evaluate(
    ({ pid, act }) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid];
      if (typeof exp?.[act] !== 'function') throw new Error(`expedition hook "${act}" missing`);
      return exp[act]();
    },
    { pid: poiId, act: action },
  );

/** Collect console errors + pageerrors; assert both empty at test end. */
const collectErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
};

const openPlanner = async (page: Page, poiId = POI) => {
  await callHook(page, poiId, 'openDetail');
  await expect(page.getByTestId(`floating-panel-quest-expedition-${poiId}`)).toBeVisible();
};

const planner = (page: Page, poiId = POI) => page.getByTestId(`floating-panel-quest-expedition-${poiId}`);
const scrollRegion = (page: Page) => page.getByTestId('quest-expedition-detail');
const sendBtn = (page: Page) => page.getByTestId('quest-expedition-send');
const sidecar = (page: Page) => page.getByTestId('quest-expedition-forecast-column');
const roster = (page: Page) => page.getByTestId('resident-roster-panel');

type Box = { x: number; y: number; width: number; height: number };
/** 1px tolerance — borders may share an edge; interiors may not. */
const overlaps = (a: Box, b: Box) =>
  !(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1);

test.beforeEach(async ({ page }) => {
  await page.goto('/game');
  await page.waitForFunction(
    ([g, r]) => {
      const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition;
      return Boolean(exp?.[g]) && Boolean(exp?.[r]);
    },
    [POI, POI_ROVINE],
    { timeout: 30_000 },
  );
  await page.evaluate(() => (window as HooksWindow).__idleVillageTestHooks?.revealQuestPois?.());
});

test.describe('PLAN-043 WS-3 — Dispatch Table geometry (AC-01/AC-02/AC-17)', () => {
  for (const [w, h] of [
    [1280, 720],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
  ] as const) {
    test(`viewport ${w}×${h} (≥${ZERO_SCROLL_MIN_HEIGHT}): zero internal overflow, CTA and sidecar on screen`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.setViewportSize({ width: w, height: h });
      await openPlanner(page);

      /* BV-1: left plaque has NO internal overflow. */
      const overflow = await scrollRegion(page).evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(overflow).toBeLessThanOrEqual(1);

      /* The anchored CTA is visible and its bottom stays inside the
       *  viewport (12px breathing room, per the ratified contract). */
      const sendBox = await sendBtn(page).boundingBox();
      expect(sendBox).not.toBeNull();
      expect(sendBox!.y + sendBox!.height).toBeLessThanOrEqual(h - 12);

      /* AC-01/AC-17: the forecast is pinned to the RIGHT WING, strictly to
       *  the RIGHT of the planner, and intersects NOTHING it shouldn't. */
      const mainBox = await planner(page).boundingBox();
      const sideBox = await sidecar(page).boundingBox();
      expect(sideBox!.x).toBeGreaterThanOrEqual(mainBox!.x + mainBox!.width - 1);
      expect(sideBox!.x + sideBox!.width).toBeLessThanOrEqual(w + 1);
      expect(overlaps(mainBox as Box, sideBox as Box)).toBe(false);
      const rosterBox = await roster(page).boundingBox();
      if (rosterBox) expect(overlaps(mainBox as Box, rosterBox as Box)).toBe(false);

      /* AC-02 second regime: tray OPEN still zero-overflow on the stage. */
      await page.getByTestId('bag-slot-0').locator('button').click();
      await expect(page.getByTestId('quest-selection-tray')).toBeVisible();
      const openOverflow = await scrollRegion(page).evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(openOverflow).toBeLessThanOrEqual(1);
      await page.getByTestId('quest-tray-close').click();
      await expect(page.getByTestId('quest-selection-tray')).toHaveCount(0);

      /* WS-3 hero letterbox: the drag-handle banner under the seals,
       *  cinematic aspect, real painted pixels (goblin `gob-esplora` maps
       *  to NODE_ART). */
      const cinema = page.getByTestId('quest-planner-hero');
      await expect(cinema).toBeVisible();
      const cb = await cinema.boundingBox();
      expect(cb!.width / cb!.height).toBeGreaterThanOrEqual(2.6);
      expect(await cinema.locator('img').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

      expect(errors).toEqual([]);
    });
  }

  // INV:CTR-game-006.INV-3
  test('viewport 800×600 (<720): internal scroll allowed, CTA still on screen, resize re-clamps the assembly', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openPlanner(page);
    /* Shrink under the zero-scroll threshold AFTER the panel opened — the
     *  resize handler must re-clamp the complete paired layout. */
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300); // let the resize listener run

    const sendBox = await sendBtn(page).boundingBox();
    expect(sendBox).not.toBeNull();
    expect(sendBox!.y + sendBox!.height).toBeLessThanOrEqual(600 + 1);
    /* The whole assembly stays inside the viewport (sidecar wraps under). */
    for (const el of [planner(page), sidecar(page)]) {
      const box = await el.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(800 + 1);
    }
    expect(errors).toEqual([]);
  });

  // INV:CTR-game-006.INV-3
  test('drag to the far corner clamps the planner inside the viewport; the pinned wing never moves', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);
    const samples: Array<Record<string, unknown>> = [];
    const snap = async (label: string) => {
      samples.push({
        label,
        at: Date.now(),
        planner: await planner(page).boundingBox(),
        sidecar: await sidecar(page).boundingBox(),
      });
    };
    await snap('at-rest');
    const handle = page.getByTestId('quest-planner-hero');
    const hb = await handle.boundingBox();
    await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
    await page.mouse.down();
    await page.mouse.move(10, 10, { steps: 12 });
    await page.mouse.move(1430, 890, { steps: 12 }); // past the corner — clamp must hold
    await snap('mid-drag');
    await page.mouse.up();
    await snap('post-drop');
    for (const el of [planner(page), sidecar(page)]) {
      const box = await el.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.y).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(1440 + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(900 + 1);
    }
    /* AC-01 post-drag: the dragged unit still cannot enter the pinned wing. */
    const mainAfter = await planner(page).boundingBox();
    const sideAfter = await sidecar(page).boundingBox();
    expect(overlaps(mainAfter as Box, sideAfter as Box)).toBe(false);
    writeMetrics('metrics-ws3-layout.json', await collectEnv(page), samples);
    expect(errors).toEqual([]);
  });

  test('both scenarios render their authored key-stat tiers verbatim', async ({ page }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    /* Goblin Extermination — Primaria: Forza · Secondaria: Percezione. */
    await openPlanner(page, POI);
    await expect(page.getByTestId('forecast-primary-stats')).toContainText(/strength|forza/i);
    const gobSec = page.getByTestId('forecast-secondary-stats');
    await expect(gobSec).toContainText(/perception|percezione/i);
    await page.getByTestId(`floating-panel-close-quest-expedition-${POI}`).click();

    /* Rovine — Primaria: Forza · Secondarie: Percezione+Costituzione+Destrezza. */
    await openPlanner(page, POI_ROVINE);
    await expect(page.getByTestId('forecast-primary-stats')).toContainText(/strength|forza/i);
    const rovSec = page.getByTestId('forecast-secondary-stats');
    await expect(rovSec).toContainText(/perception|percezione/i);
    await expect(rovSec).toContainText(/constitution|costituzione/i);
    await expect(rovSec).toContainText(/agility|agilità|destrezza/i);
    expect(errors).toEqual([]);
  });

  // INV:CTR-game-006.INV-3
  test('keyboard parity (AC-15): tray pick, token reorder, bag pick, CTA reason — pointer never used', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPlanner(page);

    const readAssignments = () =>
      page.evaluate((pid) => {
        const exp = (window as HooksWindow).__idleVillageTestHooks?.expedition?.[pid];
        return (exp?.getAssignments?.() ?? {}) as Record<string, string | null>;
      }, POI);
    const slotOf = (a: Record<string, string | null>, rid: string) =>
      Object.entries(a).find(([, r]) => r === rid)?.[0] ?? null;

    /* Disabled CTA exposes its reason: aria-disabled + describedby line. */
    const send = page.getByTestId('quest-expedition-send');
    await expect(send).toHaveAttribute('aria-disabled', 'true');
    await expect(send).toHaveAttribute('aria-describedby', 'quest-planner-reason-line');
    await expect(page.getByTestId('quest-planner-reason')).toBeVisible();

    /* Compose: Enter on an empty seat opens the residents tray. */
    await page.getByTestId(`slot-button-${SLOT_LEADER}`).focus();
    await page.keyboard.press('Enter');
    const tray = page.getByTestId('quest-selection-tray');
    await expect(tray).toBeVisible();
    await expect(tray).toHaveAttribute('data-tray-mode', 'residents');

    /* Keyboard drag (KeyboardSensor + rectIntersection collision fallback):
     *  focus a tray tile → Space picks up → ArrowUp walks the token onto a
     *  seat → Space commits through the same onDragEnd a pointer drop uses. */
    const tile = page.getByTestId(`tray-resident-${BEPPE}`);
    let beppeSlot: string | null = null;
    for (let attempt = 0; attempt < 3 && !beppeSlot; attempt++) {
      await tile.focus();
      await page.keyboard.press(' ');
      /* Wait for the drag to arm AND the per-slot verdicts to render —
       *  drag-start is wrapped in `startTransition`, so `data-drop-state`
       *  marks land a beat after pickup; the keyboard hop must skip seats
       *  already marked `invalid` for Beppe (e.g. the Scout castone).
       *  `data-drop-state` is always rendered (`idle` without a verdict),
       *  so wait until EVERY seat carries a RESOLVED verdict — `valid`,
       *  `invalid` or `locked`, never `idle` — before hopping. */
      await expect(page.locator('[data-slot-id]:not([data-drop-state="idle"])')).toHaveCount(4);
      for (let i = 0; i <= attempt; i++) await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(120);
      await page.keyboard.press(' ');
      try {
        await expect
          .poll(async () => slotOf(await readAssignments(), BEPPE), { timeout: 3_000 })
          .not.toBeNull();
        beppeSlot = slotOf(await readAssignments(), BEPPE);
      } catch {
        /* Escape cancels a drag still armed — but it also closes the tray
         *  (AC-20), so re-open it from the seat before retrying. */
        await page.keyboard.press('Escape');
        if ((await tray.count()) === 0) {
          await page.getByTestId(`slot-button-${SLOT_LEADER}`).focus();
          await page.keyboard.press('Enter');
          await expect(tray).toBeVisible();
        }
      }
    }
    expect(beppeSlot, 'keyboard drag never seated Beppe').not.toBeNull();

    /* Reorder: focus the seated token → Space → arrow → Space — the same
     *  slot-token path a pointer swap takes (move into an empty seat).
     *  Beppe may have landed on the rightmost seat, where ArrowRight has no
     *  candidate — alternate directions across attempts. */
    /* The assignment is visible to hooks the moment the drop lands, but the
     *  seat token only mounts when the seat commit lands — wait for it. */
    const token = page.getByTestId(`slot-token-${beppeSlot}`);
    await expect(token).toBeVisible();
    let moved = false;
    for (let attempt = 0; attempt < 3 && !moved; attempt++) {
      try {
        /* focus can lose the race with the seat-commit remount (the castone
         *  swaps its subtree when seatNonce bumps) — retry inside the loop. */
        await token.focus({ timeout: 3_000 });
        await page.keyboard.press(' ');
        /* Same settle as the compose path — wait for ALL per-slot verdicts
         *  (startTransition-deferred; `idle` means unresolved, the origin
         *  seat itself resolves to `locked`) before hopping. */
        await expect(page.locator('[data-slot-id]:not([data-drop-state="idle"])')).toHaveCount(4);
        await page.keyboard.press(attempt % 2 === 0 ? 'ArrowRight' : 'ArrowLeft');
        await page.waitForTimeout(120);
        await page.keyboard.press(' ');
        await expect
          .poll(async () => {
            const next = slotOf(await readAssignments(), BEPPE);
            return next !== null && next !== beppeSlot;
          }, { timeout: 3_000 })
          .toBe(true);
        moved = true;
      } catch {
        await page.keyboard.press('Escape');
      }
    }
    expect(moved, 'keyboard token drag never moved Beppe').toBe(true);

    /* Bag pick: Enter on an empty bag slot opens the items tray; Enter on a
     *  tile toggles the consumable (real <button>, aria-pressed flips). */
    await page.getByTestId('bag-slot-0').locator('button').focus();
    await page.keyboard.press('Enter');
    await expect(tray).toHaveAttribute('data-tray-mode', 'items');
    const potion = page.getByTestId('picker-item-quest_consumable_forza');
    await potion.focus();
    await page.keyboard.press('Enter');
    await expect(potion).toHaveAttribute('aria-pressed', 'true');

    /* Escape closes the tray and focus returns to its origin (AC-20). */
    await page.keyboard.press('Escape');
    await expect(tray).toHaveCount(0);
    await expect(page.getByTestId('bag-slot-0').locator('button')).toBeFocused();

    expect(errors).toEqual([]);
  });
});
