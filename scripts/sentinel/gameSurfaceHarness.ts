/**
 * gameSurfaceHarness — TypeScript promotion of the F1a harness
 * (`src/docs/docs/game_surface_audit/harness/harness.mjs.txt`, PLAN-067)
 * plus the `GameSurfaceGraph` S0..S15 state navigator (PLAN-078 T-001).
 *
 * Principles (unchanged from F1a):
 *  - states are reached via app signals (hooks / data-testid), never sleeps;
 *  - every capture writes a manifest (viewport, dpr, gl backend, how the state
 *    was reached: `input-reale` | `hook-assisted`) so evidence never claims
 *    more than it proves;
 *  - motion is captured as a frame SEQUENCE, not one image;
 *  - freezing is proven via counters (`data-astro-frames`), never by eye.
 *
 * The GL backend is host-conditional via `resolveAngleBackend` (never a
 * hardcoded `--use-angle=metal`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page, type Locator } from 'playwright';
import { resolveAngleBackend, type ResolvedBackend } from './rendererBackend';
import type { PerturbationKind } from './sentinelConfig';

export const POI = 'poi-goblin';

/** In-page test-hook surface used by drivers (declared, hook-assisted seams). */
declare global {
  interface Window {
    __idleVillageTestHooks?: Record<string, any> & {
      expedition?: Record<string, Record<string, (...a: any[]) => any>>;
      advanceTicks?: (n: number) => void;
      getClock?: () => { currentTick: number; isPaused: boolean };
    };
    __pixiApp?: { ticker?: { started: boolean } };
    __i18n?: { changeLanguage: (lng: string) => Promise<unknown>; language?: string };
  }
}

export interface OpenGameOptions {
  baseURL?: string;
  viewport?: { width: number; height: number };
  reducedMotion?: 'reduce' | 'no-preference';
  deviceScaleFactor?: number;
  locale?: string;
  outDir: string;
  fakeClock?: boolean;
  /** Pre-resolved backend — callers get it from `resolveAngleBackend()`. */
  backend?: ResolvedBackend;
}

export interface HarnessCtx {
  backend: ResolvedBackend;
  fakeClock: boolean;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  outDir: string;
  viewport: { width: number; height: number };
  reducedMotion: string;
  deviceScaleFactor: number;
  consoleErrors: string[];
  networkFailures: string[];
  steps: { step: string; how: string }[];
}

const note = (ctx: HarnessCtx, step: string, how: string) => ctx.steps.push({ step, how });

/**
 * Opens `/game` headless and waits for the app-ready signal (expedition hook
 * for `poi`), not a timeout. The GL backend comes from `resolveAngleBackend()`
 * so a software renderer is always declared, never silently assumed.
 */
export async function openGame({
  baseURL = process.env.SENTINEL_URL ?? process.env.HARNESS_URL ?? 'http://localhost:5198',
  viewport = { width: 1440, height: 900 },
  reducedMotion = 'no-preference',
  deviceScaleFactor = 1,
  locale = 'en-US',
  outDir,
  fakeClock = false,
  backend,
}: OpenGameOptions): Promise<HarnessCtx> {
  const gl = backend ?? resolveAngleBackend();
  const browser = await chromium.launch({ headless: true, args: gl.args });
  const context = await browser.newContext({ viewport, reducedMotion, deviceScaleFactor, locale });
  /* tsx/esbuild `keepNames` wraps serialized function expressions in a
   * `__name(fn, "n")` helper that does not exist inside the page —
   * every in-page probe (addInitScript or page.evaluate(fn)) would crash
   * with `__name is not defined` when the runner executes under tsx.
   * Seeding a no-op shim makes serialized probes self-contained. */
  await context.addInitScript('globalThis.__name ??= (fn) => fn;');
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  /* Dev-server noise must not become findings: aborted requests are normal
   * during navigation/HMR, and Vite internals/favicon/sourcemaps are not
   * product assets. */
  const isNoise = (url: string, err = '') =>
    /ERR_ABORTED|ERR_BLOCKED_BY_CLIENT/i.test(err) ||
    /\/(@vite|__vite|node_modules\/\.vite|favicon\.ico|mockServiceWorker)|\.map($|\?)/.test(url);
  /* Query strings carry cache-busters/HMR timestamps — strip them so the
   * same failing resource yields the same signature across passes. */
  const canon = (url: string) => url.split('?')[0].split('#')[0];
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText ?? '';
    if (!isNoise(r.url(), err)) networkFailures.push(`${r.method()} ${canon(r.url())} ${err}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !isNoise(r.url())) networkFailures.push(`${r.status()} ${canon(r.url())}`);
  });
  if (fakeClock) await page.clock.install(); // BEFORE goto: replaces rAF/setTimeout/Date/performance
  /* domcontentloaded (not `load`) + generous timeout: the app-ready poll
   * below owns readiness; on a loaded dev server `load` can wait for slow
   * assets that don't matter to the harness. */
  await page.goto(`${baseURL}/game`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  /* If a title screen stands between boot and the game, continue through it —
   * the same click the Director makes (input-reale). Polls both conditions so
   * a title-less boot (auto-continue) wastes no time. */
  const title = page.getByTestId('title-screen');
  const entrySteps: string[] = [];
  const deadline = Date.now() + 60_000;
  let entered = false;
  while (Date.now() < deadline) {
    try {
      if (await page.evaluate((pid) => Boolean(window.__idleVillageTestHooks?.expedition?.[pid]), POI)) {
        entered = true;
        break;
      }
    } catch {
      /* Execution context destroyed = a navigation/HMR reload raced the
       * poll — keep polling, the new document gets its own hooks. */
    }
    if (await title.isVisible().catch(() => false)) {
      await title.locator('button').first().click();
      entrySteps.push('input-reale:title-continue');
    }
    await page.waitForTimeout(250);
  }
  if (!entered) throw new Error(`openGame: expedition hook for ${POI} never mounted`);
  fs.mkdirSync(outDir, { recursive: true });
  const ctx: HarnessCtx = {
    backend: gl,
    fakeClock,
    browser,
    context,
    page,
    outDir,
    viewport,
    reducedMotion,
    deviceScaleFactor,
    consoleErrors,
    networkFailures,
    steps: entrySteps.map((how) => ({ step: 'entry', how })),
  };
  return ctx;
}

/** Calls a per-POI expedition test hook (declared hook-assisted seam). */
export async function expedition<T = unknown>(
  ctx: HarnessCtx,
  action: string,
  args: unknown[] = [],
  poi: string = POI,
): Promise<T> {
  /* Shared-worktree note (T-13): another session's HMR write reloads the
   * dev page — the execution context dies mid-evaluate AND the fresh
   * document has no hooks until the app remounts them. Retry on both. */
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return (await ctx.page.evaluate(
        ({ pid, act, a }) => window.__idleVillageTestHooks?.expedition?.[pid]?.[act]?.(...a),
        { pid: poi, act: action, a: args },
      )) as T;
    } catch (e) {
      const msg = String(e);
      if (attempt === 2 || !/execution context|destroyed|reading 'expedition'/i.test(msg)) throw e;
      /* Wait for the app to remount hooks on the fresh document. */
      await ctx.page
        .waitForFunction(() => Boolean(window.__idleVillageTestHooks?.expedition), undefined, { timeout: 30_000 })
        .catch(() => {});
    }
  }
  throw new Error('unreachable');
}

/** Canonical clock — unpauses the store for the synthetic span, restores after. */
export async function advanceTicks(ctx: HarnessCtx, n: number): Promise<void> {
  /* A navigation/HMR reload can destroy the execution context mid-evaluate;
   * the hook is optional (`?.`), so retrying once is safe. */
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await ctx.page.evaluate((k) => window.__idleVillageTestHooks?.advanceTicks?.(k), n);
      return;
    } catch (e) {
      if (attempt === 1 || !/execution context|destroyed/i.test(String(e))) throw e;
      await ctx.page.waitForTimeout(500);
    }
  }
}

/** Switches UI language through the DEV i18n handle and waits for it to stick. */
export async function setLocale(ctx: HarnessCtx, lng: 'en' | 'it-IT'): Promise<void> {
  await ctx.page.evaluate(async (l) => {
    await window.__i18n?.changeLanguage(l);
  }, lng);
  await ctx.page.waitForFunction((l) => window.__i18n?.language === l, lng, { timeout: 10_000 });
  note(ctx, 'locale', `i18n:${lng}`);
}

/** Waits for the boot overlay to stop intercepting pointer events. */
export async function waitBootCleared(ctx: HarnessCtx): Promise<void> {
  await ctx.page
    .getByTestId('game-boot-screen')
    .waitFor({ state: 'detached', timeout: 60_000 })
    .catch(async () => {
      await ctx.page.getByTestId('game-boot-screen').waitFor({ state: 'hidden', timeout: 10_000 });
    });
}

/**
 * Drives the goblin run to a beat with an armed skill check
 * (`quest-check-board` visible). `demoLaunch` is hook-assisted (declared in
 * the manifest); beat/choice input is real.
 */
export async function reachSkillCheck(ctx: HarnessCtx, { timeoutMs = 240_000 } = {}): Promise<boolean> {
  const { page } = ctx;
  await expedition(ctx, 'demoLaunch');
  note(ctx, 'launch', 'hook-assisted:demoLaunch');
  await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 30_000 });
  const board = page.getByTestId('quest-check-board');
  const deadline = Date.now() + timeoutMs;
  let guard = 0;
  while (Date.now() < deadline) {
    if (await board.first().isVisible().catch(() => false)) {
      note(ctx, 'skillcheck', `reached after ${guard} driver steps`);
      return true;
    }
    if (await page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
      await page.keyboard.press('Enter');
    } else {
      const choice = page.locator('[data-testid="quest-window-choice"]:not([disabled])').first();
      if (await choice.isVisible().catch(() => false)) {
        await choice.click();
      } else {
        await advanceTicks(ctx, 3);
      }
    }
    guard++;
    await page.waitForTimeout(120);
  }
  return false;
}

/**
 * Driver to the ARMED check state (check mounted, `.da-tira` visible, no
 * verdict). Throws if the driver slips past the target — never reports a
 * different state as armed.
 */
export async function driveToArmedCheck(
  ctx: HarnessCtx,
  { timeoutMs = 240_000, afterEnterMs = 800 } = {},
): Promise<{ armed: boolean; mounted: true }> {
  const { page } = ctx;
  await expedition(ctx, 'demoLaunch');
  note(ctx, 'launch', 'hook-assisted:demoLaunch');
  await page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 30_000 });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.getByTestId('quest-check-column').count()) break;
    if (await page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(afterEnterMs);
      continue;
    }
    const c = page.locator('[data-testid="quest-window-choice"]:not([disabled])').first();
    if (await c.isVisible().catch(() => false)) await c.click();
    else await advanceTicks(ctx, 3);
    await page.waitForTimeout(120);
  }
  note(ctx, 'to-check', 'input-reale (Enter/click) + advanceTicks hook');
  const state = await page.evaluate(() => ({
    verdict: !!document.querySelector('[data-testid="quest-verdict-card"]'),
    parked: !!document.querySelector('[data-astro-idle="parked"]'),
  }));
  if (state.verdict || state.parked) {
    throw new Error('driver skipped the skill check (verdict already mounted)');
  }
  return { armed: false, mounted: true };
}

/**
 * Runs the quest to its end state (reward popup or close-report button),
 * clicking real choices and advancing the canonical clock between frontiers.
 * Returns the last run snapshot seen.
 */
export async function runToSettlement(
  ctx: HarnessCtx,
  { timeoutMs = 420_000, pickOffset = 0 } = {},
): Promise<{ nodeId: string | null; ended: boolean; outcome: string | null }> {
  const { page } = ctx;
  const getRun = () =>
    expedition<{ nodeId: string; ended: boolean; outcome: string | null; frontier: { status: string } } | null>(
      ctx,
      'getRun',
    ).then((r) => r && { nodeId: r.nodeId, ended: r.ended, outcome: r.outcome, frontier: r.frontier });
  const deadline = Date.now() + timeoutMs;
  const started = Date.now();
  let repeats = 0;
  let lastChoice = '';
  while (Date.now() < deadline) {
    const run = await getRun();
    /* The run object mounts a beat or two after `demoLaunch` — give it a
     * grace window before declaring the driver done. */
    if (!run) {
      if (Date.now() - started > 15_000) break;
      await page.waitForTimeout(250);
      continue;
    }
    if (run.ended) {
      const settled =
        (await page.getByTestId('quest-reward-popup').isVisible().catch(() => false)) ||
        (await page.getByTestId('quest-window-close-report').isVisible().catch(() => false));
      if (settled) return { nodeId: run.nodeId, ended: true, outcome: run.outcome };
    }
    if (await page.getByTestId('quest-check-column').count()) {
      if (await page.getByTestId('quest-verdict-card').isVisible().catch(() => false)) {
        await page.getByTestId('quest-verdict-card').click().catch(() => {});
        await page.waitForTimeout(400);
        continue;
      }
      if (await page.locator('.da-tira').isVisible().catch(() => false)) {
        await page.locator('.da-tira').click({ timeout: 5_000 }).catch(() => {});
        await page
          .waitForFunction(() => document.querySelector('[data-testid="quest-verdict-card"]'), undefined, {
            timeout: 40_000,
          })
          .catch(() => {});
        await page.getByTestId('quest-verdict-card').click({ position: { x: 20, y: 10 } }).catch(() => {});
        await page.waitForTimeout(600);
        continue;
      }
      /* Check column mounted but neither roll button nor verdict — an
       * intermediate phase (arming/parked): keep the clock moving instead
       * of hard-waiting on a control that may need another beat. */
      await advanceTicks(ctx, 3);
      await page.waitForTimeout(250);
      continue;
    }
    if (await page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(800);
      continue;
    }
    const choices = page.locator('[data-testid="quest-window-choice"]:not([disabled])');
    const n = await choices.count();
    if (n > 0 && run.frontier?.status === 'waiting') {
      repeats = run.nodeId === lastChoice ? repeats + 1 : 0;
      lastChoice = run.nodeId ?? '';
      /* Overlay races (reward popups, tooltips) can intercept a choice click
       * mid-frame — a swallowed click just costs one loop iteration. */
      await choices.nth((pickOffset + repeats) % n).click({ timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(500);
      continue;
    }
    await advanceTicks(ctx, 3);
    await page.waitForTimeout(150);
  }
  const last = await getRun();
  return { nodeId: last?.nodeId ?? null, ended: Boolean(last?.ended), outcome: last?.outcome ?? null };
}

/** Screenshot + manifest. `target` optionally crops to a locator. */
export async function snap(ctx: HarnessCtx, name: string, target?: Locator): Promise<string> {
  const file = path.join(ctx.outDir, `${name}.png`);
  const opts = { path: file, type: 'png' as const, timeout: 120_000 };
  if (target) await target.screenshot(opts);
  else await ctx.page.screenshot(opts);
  const entry = {
    file: path.basename(file),
    viewport: ctx.viewport,
    deviceScaleFactor: ctx.deviceScaleFactor,
    reducedMotion: ctx.reducedMotion,
    rendererClass: ctx.backend.rendererClass,
    softwareRenderer: ctx.backend.software,
    at: new Date().toISOString(),
    howStateReached: ctx.steps.map((s) => `${s.step}:${s.how}`),
    limitation: 'Un frame solo: non prova movimento né assenza di movimento (T-04).',
  };
  fs.writeFileSync(path.join(ctx.outDir, `${name}.json`), JSON.stringify(entry, null, 2));
  return file;
}

/** N frames at a fixed interval + astrolabe frame counter per frame. */
export async function frameSequence(
  ctx: HarnessCtx,
  name: string,
  { frames = 8, intervalMs = 400, target }: { frames?: number; intervalMs?: number; target?: Locator } = {},
) {
  const rows = [];
  for (let i = 0; i < frames; i++) {
    const meta = await ctx.page.evaluate(() => {
      const s = document.querySelector('[data-astro-frames]');
      return {
        astroFrames: s ? Number(s.getAttribute('data-astro-frames')) : null,
        astroIdle: document.querySelector('[data-astro-idle]')?.getAttribute('data-astro-idle') ?? null,
        runningAnimations: document.getAnimations().filter((a) => a.playState === 'running').length,
        pausedAnimations: document.getAnimations().filter((a) => a.playState === 'paused').length,
        t: performance.now(),
      };
    });
    const file = await snap(ctx, `${name}-${String(i).padStart(2, '0')}`, target);
    rows.push({ i, file: path.basename(file), ...meta });
    await ctx.page.waitForTimeout(intervalMs);
  }
  fs.writeFileSync(path.join(ctx.outDir, `${name}-sequence.json`), JSON.stringify(rows, null, 2));
  return rows;
}

/**
 * C1–C9 DOM measurement inside `rootSelector` — numbers, not verdicts.
 * Declared limits travel inside the result (gradient backgrounds, canvas
 * unmeasurable by DOM).
 */
export async function measure(ctx: HarnessCtx, rootSelector = 'body') {
  return ctx.page.evaluate((sel) => {
    const root = document.querySelector(sel) ?? document.body;
    const vis = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
    };
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
    };
    const label = (el: Element) =>
      el.getAttribute('data-testid') || el.getAttribute('aria-label') || el.getAttribute('data-engraved') ||
      `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;

    const c1: any[] = [];
    root.querySelectorAll('button, [role="button"], a').forEach((b) => {
      if (!vis(b)) return;
      if ((b.textContent || '').trim().length > 0) return;
      const glyphs = [...b.querySelectorAll('svg, img')].filter(vis);
      if (glyphs.length !== 1) return;
      const bb = b.getBoundingClientRect();
      const leafs = [...b.querySelectorAll('*')].filter((e) => vis(e) && e.children.length === 0 && !e.closest('svg'));
      const extras = leafs.filter((e) => e !== glyphs[0]);
      const parts = [glyphs[0], ...extras].map((e) => e.getBoundingClientRect());
      const u = { x0: Math.min(...parts.map((r) => r.left)), x1: Math.max(...parts.map((r) => r.right)), y0: Math.min(...parts.map((r) => r.top)), y1: Math.max(...parts.map((r) => r.bottom)) };
      const dx = (u.x0 + u.x1) / 2 - (bb.x + bb.width / 2);
      const dy = (u.y0 + u.y1) / 2 - (bb.y + bb.height / 2);
      c1.push({ el: label(b), kind: extras.length ? 'icon+indicator' : 'icon-only', indicators: extras.map((e) => ({ w: +e.getBoundingClientRect().width.toFixed(1), h: +e.getBoundingClientRect().height.toFixed(1), bg: getComputedStyle(e).backgroundColor })), dx: +dx.toFixed(2), dy: +dy.toFixed(2), box: box(b) });
    });

    const c2: any[] = [];
    root.querySelectorAll('*').forEach((p) => {
      const cs = getComputedStyle(p);
      if (!vis(p) || cs.display !== 'flex' || cs.flexDirection.startsWith('column')) return;
      const kids = [...p.children].filter(vis);
      if (kids.length < 2) return;
      const cy = kids.map((k) => { const r = k.getBoundingClientRect(); return r.y + r.height / 2; });
      const spread = Math.max(...cy) - Math.min(...cy);
      if (spread > 0.5) c2.push({ container: label(p), kids: kids.length, centerYSpread: +spread.toFixed(2), alignItems: cs.alignItems });
    });

    const gaps = new Set<number>(); const fonts = new Set<number>(); const small: any[] = [];
    root.querySelectorAll('*').forEach((el) => {
      if (!vis(el)) return;
      const cs = getComputedStyle(el);
      [cs.rowGap, cs.columnGap, cs.paddingTop, cs.paddingLeft, cs.marginTop, cs.marginLeft].forEach((v) => {
        const n = parseFloat(v); if (n > 0) gaps.add(+n.toFixed(1));
      });
      if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())) {
        const fs = parseFloat(cs.fontSize); fonts.add(+fs.toFixed(1));
        if (fs < 12) small.push({ el: label(el), fontSize: fs, text: el.textContent!.trim().slice(0, 30) });
      }
    });

    const c4: any[] = [];
    root.querySelectorAll('svg').forEach((s) => {
      if (!vis(s)) return;
      const r = s.getBoundingClientRect();
      if (r.width > 64 || r.height > 64) return;
      const p = s.querySelector('path, circle, rect, line');
      const cs = p ? getComputedStyle(p) : null;
      c4.push({
        set: s.hasAttribute('data-engraved') ? 'engraved' : 'other',
        id: s.getAttribute('data-engraved') || s.getAttribute('aria-label') || s.closest('[data-testid]')?.getAttribute('data-testid') || '?',
        w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        strokeWidth: cs ? cs.strokeWidth : null, fill: cs ? cs.fill : null, stroke: cs ? cs.stroke : null,
      });
    });

    const c5: any[] = [];
    root.querySelectorAll('*').forEach((el) => {
      if (!vis(el)) return;
      const cs = getComputedStyle(el);
      const clips = cs.overflowX !== 'visible' || cs.overflowY !== 'visible';
      if (clips && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) {
        c5.push({ el: label(el), overflow: `${cs.overflowX}/${cs.overflowY}`, scroll: [el.scrollWidth, el.scrollHeight], client: [el.clientWidth, el.clientHeight] });
      }
    });

    const c7: any[] = [];
    root.querySelectorAll('button, [role="button"], [role="radio"], a, input').forEach((b) => {
      if (!vis(b)) return;
      const r = b.getBoundingClientRect();
      if (Math.min(r.width, r.height) < 32) c7.push({ el: label(b), w: +r.width.toFixed(1), h: +r.height.toFixed(1), disabled: (b as HTMLButtonElement).disabled === true });
    });

    const panels = [...document.querySelectorAll('[data-hud-panel], [data-stage-panel]')].filter(vis);
    const rects = panels.map((p) => ({ id: p.getAttribute('data-hud-panel') || p.getAttribute('data-stage-panel'), ...box(p) }));
    const vw = innerWidth, vh = innerHeight;
    const overlaps: any[] = [];
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 1 && oy > 1) overlaps.push({ a: a.id, b: b.id, area: Math.round(ox * oy) });
    }
    const covered = rects.reduce((s, r) => s + r.w * r.h, 0) / (vw * vh);

    const anims = document.getAnimations().map((a) => ({
      state: a.playState,
      target: (a.effect as unknown as { target?: Element })?.target ? label((a.effect as unknown as { target: Element }).target) : '?',
      duration: (a.effect?.getTiming?.() as any)?.duration,
      easing: (a.effect?.getTiming?.() as any)?.easing,
      iterations: (a.effect?.getTiming?.() as any)?.iterations,
    }));
    const astro = document.querySelector('[data-astro-frames]');

    return {
      root: sel, viewport: { w: vw, h: vh },
      C1_centering: { count: c1.length, withIndicator: c1.filter((x) => x.kind === 'icon+indicator').map((x: any) => ({ el: x.el, indicators: x.indicators })), worstAbs: c1.length ? +Math.max(...c1.map((x) => Math.max(Math.abs(x.dx), Math.abs(x.dy)))).toFixed(2) : null, offenders: c1.filter((x) => Math.abs(x.dx) > 1 || Math.abs(x.dy) > 1) },
      C2_alignment: { rowsWithSpread: c2.length, worst: c2.sort((a, b) => b.centerYSpread - a.centerYSpread).slice(0, 8) },
      C3_rhythm: { distinctSpacings: [...gaps].sort((a, b) => a - b), distinctFontSizes: [...fonts].sort((a, b) => a - b), below12px: small.slice(0, 10) },
      C4_icons: { count: c4.length, bySet: c4.reduce((m: Record<string, number>, i: any) => ((m[i.set] = (m[i.set] || 0) + 1), m), {}), sizes: [...new Set(c4.map((i) => `${i.w}x${i.h}`))], strokeWidths: [...new Set(c4.map((i) => i.strokeWidth))], items: c4 },
      C5_clipping: c5.slice(0, 15),
      C6_contrast: 'NON misurato dal DOM: sfondi a gradiente/immagine; richiede campionamento pixel (F1b).',
      C7_smallTargets: c7,
      C8_occupancy: { coveredFractionOfViewport: +covered.toFixed(3), panels: rects, overlaps },
      C9_motion: { animations: anims.length, running: anims.filter((a) => a.state === 'running').length, paused: anims.filter((a) => a.state === 'paused').length, sample: anims.slice(0, 12), astroFrames: astro ? Number(astro.getAttribute('data-astro-frames')) : null, astroIdle: document.querySelector('[data-astro-idle]')?.getAttribute('data-astro-idle') ?? null },
      limits: ['canvas Pixi non misurabile dal DOM', 'C6 e C10 non meccanici qui', 'bbox, non centro ottico'],
    };
  }, rootSelector);
}

/**
 * C6 contrast from PIXELS: for each element with own text, computed (opaque)
 * text color vs the modal background color of its box on a real screenshot.
 */
export async function contrastFromPixels(ctx: HarnessCtx, rootSelector = 'body', { max = 120 } = {}) {
  const { page } = ctx;
  const png = (await page.screenshot({ type: 'png' })).toString('base64');
  return page.evaluate(async ({ sel, png, max }) => {
    const root = document.querySelector(sel) ?? document.body;
    const items: any[] = [];
    root.querySelectorAll('*').forEach((el) => {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent?.trim()).map((n) => n.textContent!.trim()).join(' ');
      if (!own) return;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width < 4 || r.height < 6 || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return;
      if (r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) return;
      let op = 1, clipped = false;
      for (let a: Element | null = el; a && a !== document.documentElement; a = a.parentElement) {
        const acs = getComputedStyle(a);
        op *= Number(acs.opacity);
        if (acs.visibility === 'hidden' || acs.display === 'none') op = 0;
        if (a !== el && (acs.overflowX !== 'visible' || acs.overflowY !== 'visible')) {
          const ar = a.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
          if (cx < ar.left || cx > ar.right || cy < ar.top || cy > ar.bottom) clipped = true;
        }
      }
      if (op < 0.15 || clipped) return;
      const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.x + r.width / 2), Math.min(innerHeight - 1, r.y + r.height / 2));
      if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) return;
      const m = cs.color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (!m) return;
      items.push({ el: el.getAttribute('data-testid') || el.className?.toString().split(' ')[0] || el.tagName.toLowerCase(), text: own.slice(0, 28), rect: r, fg: [+m[1], +m[2], +m[3]], alpha: m[4] === undefined ? 1 : +m[4], size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) || 400 });
    });
    const img = await createImageBitmap(await (await fetch('data:image/png;base64,' + png)).blob());
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d', { willReadFrequently: true })!; g.drawImage(img, 0, 0);
    const lum = ([r, gg, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
    const ratio = (a: number[], b: number[]) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
    const out: any[] = [];
    for (const it of items.slice(0, max)) {
      const x = Math.max(0, Math.floor(it.rect.x)), y = Math.max(0, Math.floor(it.rect.y));
      const w = Math.min(img.width - x, Math.ceil(it.rect.width)), h = Math.min(img.height - y, Math.ceil(it.rect.height));
      if (w < 2 || h < 2) continue;
      const d = g.getImageData(x, y, w, h).data; const bins = new Map<number, number[]>();
      for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4); const e = bins.get(k) || [0, 0, 0, 0]; e[0]++; e[1] += d[i]; e[2] += d[i + 1]; e[3] += d[i + 2]; bins.set(k, e); }
      const top = [...bins.values()].sort((a, b) => b[0] - a[0])[0];
      const bg = [top[1] / top[0], top[2] / top[0], top[3] / top[0]];
      const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
      const cr = ratio(it.fg, bg);
      out.push({ el: it.el, text: it.text, size: it.size, fg: it.fg.map(Math.round), bg: bg.map(Math.round), ratio: +cr.toFixed(2), need: large ? 3 : 4.5, fail: cr < (large ? 3 : 4.5), alpha: it.alpha });
    }
    return { measured: out.length, failing: out.filter((o) => o.fail).length, worst: [...out].sort((a, b) => a.ratio - b.ratio).slice(0, 12), note: 'bg = moda pixel nel box; esclusi testi con opacità cumulata <0.15, ritagliati o coperti; alpha<1 sottostima il fg; approssimato.' };
  }, { sel: rootSelector, png, max });
}

/** C5b: interactive/text children bleeding out of a HudPlaque's inner band. */
export async function plaqueOverflow(ctx: HarnessCtx, { bandPx = 6 } = {}) {
  return ctx.page.evaluate((band) => {
    const out: any[] = [];
    for (const pl of document.querySelectorAll('[data-skin="hud-plaque"]')) {
      const p = pl.getBoundingClientRect(); if (p.width < 1) continue;
      const inner = { l: p.left + band, r: p.right - band, t: p.top + band, b: p.bottom - band };
      const kids = [...pl.querySelectorAll('button, [role="button"], [role="radio"], a, span, svg')].filter((k) => { const r = k.getBoundingClientRect(); return r.width > 2 && r.height > 2 && !k.closest('svg[aria-hidden="true"][data-plaque-frame]'); });
      for (const k of kids) {
        const r = k.getBoundingClientRect();
        const o = { left: Math.max(0, inner.l - r.left), right: Math.max(0, r.right - inner.r), top: Math.max(0, inner.t - r.top), bottom: Math.max(0, r.bottom - inner.b) };
        const worst = Math.max(o.left, o.right, o.top, o.bottom);
        if (worst > 0.5 && (k.matches('button,[role="button"],[role="radio"],a') || (k.textContent || '').trim())) out.push({ plaque: (pl.textContent || '').replace(/\s+/g, ' ').slice(0, 24), el: k.getAttribute('aria-label') || (k.textContent || k.tagName).trim().slice(0, 24), over: Object.fromEntries(Object.entries(o).map(([a, b]) => [a, +b.toFixed(1)])), plaqueBox: [Math.round(p.x), Math.round(p.y), Math.round(p.width), Math.round(p.height)], elBox: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] });
      }
    }
    return out.sort((a, b) => Math.max(...Object.values(b.over as Record<string, number>)) - Math.max(...Object.values(a.over as Record<string, number>))).slice(0, 25);
  }, bandPx);
}

/**
 * C5c «respiro dalla cornice»: controls closer than
 * `--skin-hud-plaque-clearance` + `--skin-hud-panel-padding` (≈22px) to a
 * plaque edge. Reported per control, sorted worst-first.
 */
export async function plaqueClearance(ctx: HarnessCtx) {
  return ctx.page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const px = (v: string) => parseFloat(cs.getPropertyValue(v)) || 0;
    const need = px('--skin-hud-plaque-clearance') + px('--skin-hud-panel-padding') || 22;
    const out: any[] = [];
    for (const pl of document.querySelectorAll('[data-skin="hud-plaque"]')) {
      const p = pl.getBoundingClientRect(); if (p.width < 1) continue;
      for (const k of pl.querySelectorAll('button, [role="button"], [role="radio"], [role="group"]')) {
        const r = k.getBoundingClientRect(); if (r.width < 2) continue;
        const gap = { left: r.left - p.left, right: p.right - r.right, top: r.top - p.top, bottom: p.bottom - r.bottom };
        const min = Math.min(...Object.values(gap));
        out.push({ plaque: (pl.textContent || '').replace(/\s+/g, ' ').slice(0, 18), el: (k.getAttribute('aria-label') || k.textContent || '').trim().slice(0, 18), need, minGap: +min.toFixed(1), gap: Object.fromEntries(Object.entries(gap).map(([a, b]) => [a, Math.round(b)])), fail: min < need });
      }
    }
    return out.filter((o) => o.fail).sort((a, b) => a.minGap - b.minGap);
  });
}

/**
 * Lens audit L1–L9 per visible «surface» (HUD panels, plaques, tooltips,
 * popovers, check column, registry list): text collisions, truncations,
 * font families, off-palette hues, button grammars, zero rows, circle-symbol,
 * <12px text, <22px frame breathing room. Numbers and samples, no verdicts.
 */
export async function lensAudit(ctx: HarnessCtx) {
  return ctx.page.evaluate(() => {
    const vis = (e: Element) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none') return false; let op = 1; for (let a: Element | null = e; a && a !== document.documentElement; a = a.parentElement) op *= Number(getComputedStyle(a).opacity); return op > 0.15 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
    const own = (e: Element) => [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent?.trim()).map((n) => n.textContent!.trim()).join(' ');
    const sel = '[data-hud-panel],[data-stage-panel],[data-skin="hud-plaque"],[role="tooltip"],[data-radix-popper-content-wrapper],[role="menu"],[role="dialog"],[data-testid="quest-check-column"],[data-testid="village-registry-list"]';
    const roots = [...document.querySelectorAll(sel)].filter(vis).filter((r, i, a) => !a.some((o) => o !== r && o.contains(r) && o.matches('[data-hud-panel],[data-stage-panel],[role="dialog"]')));
    const hue = (c: string) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/); if (!m) return null; const [r, g, b] = [+m[1] / 255, +m[2] / 255, +m[3] / 255]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (d < 0.25 || mx < 0.35) return null; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return h; };
    const fam = (h: number | null) => h == null ? null : (h >= 165 && h <= 200) ? 'cyan' : (h >= 85 && h < 165) ? 'green' : (h < 15 || h >= 340) ? 'red' : (h >= 270 && h < 340) ? 'purple' : null;
    const need = 22;
    return roots.map((root) => {
      const R = root.getBoundingClientRect();
      const name = root.getAttribute('data-hud-panel') || root.getAttribute('data-stage-panel') || root.getAttribute('data-testid') || root.getAttribute('role') || (own(root) || root.textContent || '').replace(/\s+/g, ' ').slice(0, 24) || 'plaque';
      const texts = [...root.querySelectorAll('*')].filter((e) => own(e) && vis(e));
      const col: any[] = []; for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) { const a = texts[i], b = texts[j]; if (a.contains(b) || b.contains(a)) continue; const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); const ox = Math.min(p.right, q.right) - Math.max(p.left, q.left), oy = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top); if (ox > 3 && oy > 3) col.push([own(a).slice(0, 18), own(b).slice(0, 18), Math.round(ox * oy)]); }
      const trunc = texts.filter((e) => { const s = getComputedStyle(e); return (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) || /…$/.test(own(e)); }).map((e) => own(e).slice(0, 24));
      const fonts: Record<string, number> = {}; texts.forEach((e) => { const f = getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim(); fonts[f] = (fonts[f] || 0) + 1; });
      const off: Record<string, number> = {}; const offS: any[] = []; texts.forEach((e) => { const f = fam(hue(getComputedStyle(e).color)); if (f) { off[f] = (off[f] || 0) + 1; if (offS.length < 6) offS.push([f, own(e).slice(0, 16)]); } });
      root.querySelectorAll('svg').forEach((s) => { if (!vis(s)) return; const f = fam(hue(getComputedStyle(s).color)) || fam(hue(getComputedStyle(s.querySelector('path,circle,rect') || s).fill)); if (f) off['icon-' + f] = (off['icon-' + f] || 0) + 1; });
      const gram = new Set<string>(); root.querySelectorAll('button,[role="button"],[role="radio"]').forEach((b) => { if (!vis(b)) return; const s = getComputedStyle(b), r = b.getBoundingClientRect(); const rad = parseFloat(s.borderTopLeftRadius); const shape = rad >= Math.min(r.width, r.height) / 2 - 1 ? (Math.abs(r.width - r.height) < 3 ? 'circle' : 'pill') : rad > 2 ? 'rounded' : 'square'; gram.add(`${shape}/${Math.round(r.height)}`); });
      const zeros = texts.filter((e) => /^(0|0%|0\.0|×0|\+0)$/.test(own(e))).length;
      let circSym = 0; root.querySelectorAll('svg,img').forEach((s) => { const p = s.parentElement; if (!p || !vis(s)) return; const ps = getComputedStyle(p), pr = p.getBoundingClientRect(); if (parseFloat(ps.borderTopLeftRadius) >= pr.width / 2 - 1 && Math.abs(pr.width - pr.height) < 3 && (ps.borderTopWidth !== '0px' || ps.backgroundColor !== 'rgba(0, 0, 0, 0)')) circSym++; });
      const small = texts.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12).map((e) => `${own(e).slice(0, 14)}@${getComputedStyle(e).fontSize}`);
      let clr = 0; root.querySelectorAll('button,[role="button"]').forEach((b) => { if (!vis(b)) return; const r = b.getBoundingClientRect(); const g = Math.min(r.left - R.left, R.right - r.right, r.top - R.top, R.bottom - r.bottom); if (g < need && root.matches('[data-skin="hud-plaque"]')) clr++; });
      return { name, box: [Math.round(R.x), Math.round(R.y), Math.round(R.width), Math.round(R.height)], texts: texts.length,
        L1_collisions: col.slice(0, 8), L1n: col.length, L2_truncated: trunc.slice(0, 8), L3_fonts: fonts, L4_offPalette: off, L4_samples: offS,
        L5_buttonGrammars: [...gram], L6_zeroValues: zeros, L7_circleWithSymbol: circSym, L8_small: small.slice(0, 8), L8n: small.length, L9_tightToFrame: clr };
    });
  });
}

/** Warm-up: waits until a probe screenshot costs less than `budgetMs`. */
export async function warmUp(ctx: HarnessCtx, { budgetMs = 3000, tries = 12 } = {}): Promise<number> {
  for (let i = 0; i < tries; i++) {
    const t = Date.now();
    await ctx.page.screenshot({ timeout: 120_000 });
    const dt = Date.now() - t;
    ctx.steps.push({ step: 'warmup', how: `${dt}ms` });
    if (dt < budgetMs) return dt;
    await ctx.page.waitForTimeout(1500);
  }
  return -1;
}

/** Writes the session manifest and closes the browser. */
export async function close(ctx: HarnessCtx): Promise<void> {
  fs.writeFileSync(
    path.join(ctx.outDir, 'manifest.json'),
    JSON.stringify({ steps: ctx.steps, consoleErrors: ctx.consoleErrors.slice(0, 20), networkFailures: ctx.networkFailures.slice(0, 20), rendererClass: ctx.backend.rendererClass }, null, 2),
  );
  await ctx.browser.close();
}

/* ------------------------------------------------------------------ */
/* GameSurfaceGraph — S0..S15 macro-state navigator (PLAN-078 §2 Layer A) */
/* ------------------------------------------------------------------ */

export interface SurfaceNode {
  /** Stable id used in fingerprints and the run manifest. */
  id: string;
  /** Selector whose visibility proves the state was reached. */
  readySignal: string;
  /** Deterministic driver to the state — app signals, never sleeps. */
  reach: (ctx: HarnessCtx) => Promise<void>;
  /** Perturbation operators allowed on this node. */
  perturbations: PerturbationKind[];
  /** Nodes whose perturbation budget may be skipped when absent. */
  optional?: boolean;
}

const waitVisible = (ctx: HarnessCtx, sel: string, timeout = 30_000) =>
  ctx.page.locator(sel).first().waitFor({ state: 'visible', timeout });

/** S0 → S1: continue through the title screen if present (input-reale). */
async function enterGame(ctx: HarnessCtx): Promise<void> {
  const title = ctx.page.getByTestId('title-screen');
  if (await title.isVisible().catch(() => false)) {
    await title.locator('button').first().click();
    note(ctx, 'entry', 'input-reale:title-continue');
  }
  await waitBootCleared(ctx);
}

async function openVillageView(ctx: HarnessCtx): Promise<void> {
  await enterGame(ctx);
  if (!(await ctx.page.getByTestId('village-screen-view').isVisible().catch(() => false))) {
    await ctx.page.locator('[data-nav-id="village"]').click();
    note(ctx, 'village', 'input-reale:nav-plinth');
  }
  await waitVisible(ctx, '[data-testid="village-screen-view"]');
}

/** Hovers a building pin then clicks the tooltip's open action (real input). */
async function openVillageBuildingPanel(ctx: HarnessCtx, pin: string, triggerTestId: string): Promise<void> {
  await openVillageView(ctx);
  await ctx.page.locator(`[data-building-pin="${pin}"]`).hover();
  await waitVisible(ctx, '[data-testid="village-building-tooltip"]', 10_000);
  await ctx.page.getByTestId(triggerTestId).click();
}

/**
 * The S0..S15 macro-state graph. Reach functions compose: a state reachable
 * only through another drives the whole prefix (recorded in `ctx.steps`).
 */
export const GAME_SURFACE_GRAPH: SurfaceNode[] = [
  {
    id: 'S0_BootVeil',
    readySignal: '[data-testid="game-boot-screen"], [data-testid="title-screen"]',
    reach: async (ctx) => { /* goto already landed here */ void ctx; },
    perturbations: ['VP_SWEEP'],
  },
  {
    id: 'S1_WorldMapIdle',
    readySignal: '[data-testid="world-map-layer"] canvas',
    reach: enterGame,
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT', 'SOAK_CYCLE'],
  },
  {
    id: 'S2_VillageView',
    readySignal: '[data-testid="village-screen-view"]',
    reach: openVillageView,
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S3_VillageRegistry',
    readySignal: '[data-testid="village-registry"]',
    reach: async (ctx) => {
      await openVillageView(ctx);
      if (!(await ctx.page.getByTestId('village-registry').isVisible().catch(() => false))) {
        await ctx.page.getByTestId('village-registry-chip').click();
        note(ctx, 'registry', 'input-reale:chip');
      }
      await waitVisible(ctx, '[data-testid="village-registry"]');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP'],
  },
  {
    id: 'S4_VillageStash',
    readySignal: '[data-hud-panel="villageStash"]',
    reach: async (ctx) => {
      await openVillageBuildingPanel(ctx, 'warehouse', 'village-open-stash');
      await waitVisible(ctx, '[data-hud-panel="villageStash"]');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S5_Merchant',
    readySignal: '[data-hud-panel="merchant"]',
    reach: async (ctx) => {
      await openVillageBuildingPanel(ctx, 'market', 'village-open-merchant');
      await waitVisible(ctx, '[data-hud-panel="merchant"]');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP'],
  },
  {
    id: 'S6_QuestPlanner',
    readySignal: '[data-testid="quest-expedition-detail"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      await ctx.page.evaluate(() => window.__idleVillageTestHooks?.revealQuestPois?.());
      await expedition(ctx, 'openDetail');
      note(ctx, 'planner', 'hook-assisted:openDetail');
      await waitVisible(ctx, '[data-testid="quest-expedition-detail"]');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S7_QuestJourneyOutbound',
    readySignal: '[data-testid="quest-window"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      await expedition(ctx, 'demoLaunch');
      note(ctx, 'launch', 'hook-assisted:demoLaunch');
      await waitVisible(ctx, '[data-testid="quest-window"]');
    },
    perturbations: ['VP_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S8_QuestStageNarrative',
    readySignal: '[data-testid="quest-window-beat"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      await expedition(ctx, 'demoLaunch');
      note(ctx, 'launch', 'hook-assisted:demoLaunch');
      /* The outbound leg runs on the game clock — advance ticks until the
       * first narrative beat lands instead of hard-waiting on a static DOM. */
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        if (await ctx.page.getByTestId('quest-window-beat').isVisible().catch(() => false)) return;
        await advanceTicks(ctx, 3);
        await ctx.page.waitForTimeout(150);
      }
      throw new Error('S8_QuestStageNarrative unreachable within 120s');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S9_QuestStageChoice',
    readySignal: '[data-testid="quest-window-choice"]:not([disabled])',
    reach: async (ctx) => {
      await enterGame(ctx);
      await expedition(ctx, 'demoLaunch');
      note(ctx, 'launch', 'hook-assisted:demoLaunch');
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        if (await ctx.page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().isVisible().catch(() => false)) return;
        if (await ctx.page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
          await ctx.page.keyboard.press('Enter');
        } else {
          await advanceTicks(ctx, 3);
        }
        await ctx.page.waitForTimeout(150);
      }
      throw new Error('S9_QuestStageChoice unreachable within 120s');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S10_QuestSkillCheckArmed',
    readySignal: '.da-tira',
    reach: async (ctx) => {
      await enterGame(ctx);
      await driveToArmedCheck(ctx);
      await ctx.page.locator('.da-tira').waitFor({ state: 'visible', timeout: 30_000 });
      note(ctx, 'armed', 'driver:armed');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S11_QuestSkillCheckParked',
    readySignal: '[data-astro-idle="parked"], [data-testid="quest-verdict-card"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      await driveToArmedCheck(ctx);
      await ctx.page.locator('.da-tira').waitFor({ state: 'visible', timeout: 30_000 });
      await ctx.page.locator('.da-tira').click();
      note(ctx, 'throw', 'input-reale:da-tira');
      await waitVisible(ctx, '[data-testid="quest-verdict-card"]', 40_000);
      await ctx.page.waitForFunction(() => document.querySelector('[data-astro-idle="parked"]'), undefined, { timeout: 10_000 }).catch(() => {});
    },
    perturbations: ['VP_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S12_QuestJourneyReturn',
    readySignal: '[data-testid="quest-window"], [data-testid="quest-reward-popup"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      await expedition(ctx, 'demoLaunch');
      note(ctx, 'launch', 'hook-assisted:demoLaunch');
      // Outbound is shared with S7/S9/S10 paths; reaching the return leg is
      // state-dependent, so the driver just keeps advancing until `run.ended`
      // flips true or the run is visibly heading home.
      const deadline = Date.now() + 300_000;
      while (Date.now() < deadline) {
        const run = await expedition<{ ended: boolean } | null>(ctx, 'getRun');
        if (run?.ended) return;
        if (await ctx.page.getByTestId('quest-window-beat').isVisible().catch(() => false)) await ctx.page.keyboard.press('Enter');
        else if (await ctx.page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().isVisible().catch(() => false)) {
          await ctx.page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().click();
        } else if (await ctx.page.getByTestId('quest-check-column').count()) {
          if (await ctx.page.getByTestId('quest-verdict-card').isVisible().catch(() => false)) {
            await ctx.page.getByTestId('quest-verdict-card').click().catch(() => {});
          } else if (await ctx.page.locator('.da-tira').isVisible().catch(() => false)) {
            await ctx.page.locator('.da-tira').click();
          }
        } else await advanceTicks(ctx, 3);
        await ctx.page.waitForTimeout(200);
      }
      throw new Error('S12_QuestJourneyReturn unreachable within 300s');
    },
    perturbations: ['VP_SWEEP'],
  },
  {
    id: 'S13_QuestRewardPopup',
    readySignal: '[data-testid="quest-reward-popup"], [data-testid="quest-window-close-report"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      await expedition(ctx, 'demoLaunch');
      note(ctx, 'launch', 'hook-assisted:demoLaunch');
      await runToSettlement(ctx);
      await ctx.page
        .locator('[data-testid="quest-reward-popup"], [data-testid="quest-window-close-report"]')
        .first()
        .waitFor({ state: 'visible', timeout: 60_000 });
      note(ctx, 'settlement', 'driver:runToSettlement');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP', 'LIFECYCLE_INTERRUPT'],
  },
  {
    id: 'S14_GameMenuSettings',
    readySignal: '[data-testid="settings-panel"]',
    reach: async (ctx) => {
      // Settings live on the title screen (GameEntry), before game entry.
      await ctx.page.reload();
      await waitVisible(ctx, '[data-testid="title-screen"]', 60_000);
      const settings = ctx.page
        .getByTestId('title-screen')
        .locator('button')
        .filter({ hasText: /impostazioni|settings/i });
      await settings.first().click();
      note(ctx, 'settings', 'input-reale:title-settings');
      await waitVisible(ctx, '[data-testid="settings-panel"]');
    },
    perturbations: ['VP_SWEEP', 'LOCALE_SWEEP'],
    optional: true,
  },
  {
    id: 'S15_GoblinInvasionEvent',
    readySignal: '[data-testid="invasion-goblin-marker"]',
    reach: async (ctx) => {
      await enterGame(ctx);
      // The invasion marker appears on game-clock progression; advance the
      // canonical clock and poll — if the event does not trigger within the
      // budget the node is reported unreachable (it is optional).
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        if (await ctx.page.getByTestId('invasion-goblin-marker').first().isVisible().catch(() => false)) return;
        await advanceTicks(ctx, 30);
        await ctx.page.waitForTimeout(300);
      }
      throw new Error('S15_GoblinInvasionEvent unreachable within 120s');
    },
    perturbations: ['VP_SWEEP'],
    optional: true,
  },
];

/** Looks a surface node up by id; throws on unknown ids (config bug). */
export function surfaceNode(id: string): SurfaceNode {
  const node = GAME_SURFACE_GRAPH.find((n) => n.id === id);
  if (!node) throw new Error(`unknown surface node ${id}`);
  return node;
}

/**
 * Reaches a state node and verifies its ready signal. Returns false for
 * `optional` nodes that time out — optional states report unreachable
 * instead of failing the run.
 */
export async function reachState(ctx: HarnessCtx, node: SurfaceNode): Promise<boolean> {
  try {
    await node.reach(ctx);
    await ctx.page.locator(node.readySignal).first().waitFor({ state: 'visible', timeout: 30_000 });
    return true;
  } catch (e) {
    if (node.optional) {
      note(ctx, node.id, `unreachable:optional ${e instanceof Error ? e.message : e}`);
      return false;
    }
    throw e;
  }
}
