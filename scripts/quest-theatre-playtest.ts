/**
 * quest-theatre-playtest — deterministic playtest harness for the quest
 * window (PLAN-025 T-003). Drives `/quest-window-lab?seed=N`, so runs are
 * reproducible; on each step it records what the player sees plus DOM
 * metrics (heights, overflow) used by the T-002 layout spike and the
 * presentation budgets.
 *
 * Usage:
 *   npx tsx scripts/quest-theatre-playtest.ts --seed 42 --policy greedy
 *   SEED=7 POLICY=cautious OUT=test-results/x npx tsx scripts/quest-theatre-playtest.ts
 *
 * Flags: --seed N (default 1), --policy greedy|cautious|first (default greedy),
 * --out DIR (default test-results/quest-theatre-playtest/seed-N-policy),
 * --video (records webm), --no-shots (skip screenshots).
 *
 * PLAN-040 T-000 (outsidePlaque evidence):
 *   --phases        per-step VIEWPORT shots + `outsidePlaque`/`outsideViewport`
 *                   metrics + post-run minimise/reward coverage; writes
 *                   `outside.json` next to the transcript.
 *   --width/--height  viewport (defaults 1440×900)
 *   --reward        appends `&reward=1` to the lab URL so the page-level
 *                   `QuestRewardPopup` mounts on an ended run.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { collectEnvAttestation } from './verification/attestEnv';

const arg = (name: string, fallback: string | undefined): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : (process.env[name.toUpperCase()] ?? fallback);
};
const has = (name: string): boolean => process.argv.includes(`--${name}`) || process.env[name.toUpperCase()] === '1';

const SEED = Number(arg('seed', '1')) >>> 0;
const POLICY = arg('policy', 'greedy') ?? 'greedy';
const OUT = arg('out', undefined) ?? `test-results/quest-theatre-playtest/seed-${SEED}-${POLICY}`;
const VIDEO = has('video');
const SHOTS = !has('no-shots');
const SKIP_BEATS = has('skip-beats');
const PHASES = has('phases');
const WIDTH = Number(arg('width', '1440'));
const HEIGHT = Number(arg('height', '900'));
const REWARD = has('reward');
const BASE = arg('base', 'http://localhost:5173')!;
/* Headless WebGL lands on SwiftShader — the astrolabe's goo shader starves
 * the main thread (timers included: frontier `readyAt` never arrives inside
 * the harness deadline). `--use-angle=metal` asks ANGLE for the real GPU on
 * macOS; on platforms without it Chromium silently keeps software GL. */
const GL = arg('gl', 'metal');
const WAIT_MS = Number(arg('wait-ms', '12000'));
mkdirSync(OUT, { recursive: true });

/** Element buckets for the outsidePlaque metric (PLAN-040 T-000). An element
 * is quest-owned when it is inside `[data-hud-panel="quest"]` or tagged
 * `[data-quest-owned]` (portal-rendered companions). Anchored companions
 * (`data-hud-companion`) are reported against the viewport, not the plaque —
 * popping above the choices is their design. */
interface OutsideEntry {
  tag: string;
  testid: string | null;
  label: string;
  kind: 'descendant' | 'companion' | 'questOwned';
  rect: { x: number; y: number; w: number; h: number };
  over: { left: number; right: number; top: number; bottom: number };
}
interface OutsideReport {
  phase: string;
  outsidePlaque: OutsideEntry[];
  outsideViewport: OutsideEntry[];
}

/** Bot policies: which numbered option the player prefers at each bivio. */
const POLICIES: Record<string, RegExp[]> = {
  greedy: [/Climb|from above/i, /Take the loot|Recover the loot/i, /Sneak|silent|Slip|Stealth|shadows/i, /Pursue|Run them down/i, /Rummage|Keep looting|Search again/i, /Fight|Assault|Charge/i, /Loot|Raid/i],
  cautious: [/Return|Retreat|Back|Home|Leave/i, /Look for tracks|Examine the ground/i, /Sneak|silent|Slip|shadows/i, /Fight|Assault|Charge/i],
  first: [],
};
/** Skip policy of the bot, declared: skip at the first usable frame after the anti-double-click threshold. */
const BOT_SKIP_MS = 450;

const pick = (labels: string[]): number => {
  const prefer = POLICIES[POLICY] ?? [];
  for (const re of prefer) {
    const i = labels.findIndex((l) => re.test(l));
    if (i >= 0) return i;
  }
  return 0;
};

/** Current visual phase, from what is on screen (PLAN-040 T-000). */
const phaseLabel = async (page: import('playwright').Page): Promise<string> =>
  page.evaluate(() => {
    if (document.querySelector('[data-testid="quest-window-minimised"]')) return 'minimised';
    if (document.querySelector('[data-testid="quest-reward-popup"]')) return 'reward';
    if (document.querySelector('[data-testid="quest-check-overlay"]')) return 'check';
    if (document.querySelector('[data-testid="quest-window-beat"]')) return 'beat';
    if (document.querySelector('[data-testid="quest-combat-strip"]')) return 'combat';
    if (document.querySelector('[data-testid="quest-window-close-report"]')) return 'ended';
    if (document.querySelector('[data-testid="quest-window-choice"]')) return 'choices';
    return 'idle';
  }).catch(() => 'gone');

/** Measure the quest-owned interactive/text elements that escape their
 * surface (PLAN-040 T-000). Rects are compared in VIEWPORT space — the drag
 * transform applies to the shell and its children alike, so a descendant's
 * rect vs the plaque's rect is already the visually-true comparison.
 * Returns `outsidePlaque` (plaque descendants past the plaque rect — real
 * containment defects) and `outsideViewport` (quest-owned elements, anchored
 * companions included, past the viewport — clamp defects). */
/* The measure runs as a STRING, not a function: tsx/esbuild wraps named
 * consts in a `__name()` helper that doesn't exist in the page and kills the
 * whole evaluate (silent empties). A string is sent verbatim. */
const MEASURE_OUTSIDE_SRC = `((phaseLabel_) => {
  const TOL = 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const viewport = { left: 0, right: vw, top: 0, bottom: vh };
  const plaque = document.querySelector('[data-testid="quest-window"], [data-testid="quest-window-minimised"]');
  const plaqueBox = plaque ? plaque.getBoundingClientRect() : null;
  function over(r, b) {
    return {
      left: Math.max(0, Math.round(b.left - r.left)),
      right: Math.max(0, Math.round(r.right - b.right)),
      top: Math.max(0, Math.round(b.top - r.top)),
      bottom: Math.max(0, Math.round(r.bottom - b.bottom)),
    };
  }
  function exceeds(o) {
    return o.left > TOL || o.right > TOL || o.top > TOL || o.bottom > TOL;
  }
  function describe(el) {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      testid: el.getAttribute('data-testid'),
      label: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    };
  }
  const INTERACTIVE = 'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const seen = new Set();
  const outsidePlaque = [];
  const outsideViewport = [];
  /* getBoundingClientRect reports the LAYOUT rect — a scrolled-out child of
   * an overflow container still reports a rect past the plaque even though
   * it never paints there (false positives at extreme viewports). The
   * visible rect is the layout rect intersected with every clip ancestor. */
  function clipRect(el) {
    let r = el.getBoundingClientRect();
    let n = el.parentElement;
    while (n) {
      const s = getComputedStyle(n);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const a = n.getBoundingClientRect();
        const nx = Math.max(r.x, a.x);
        const ny = Math.max(r.y, a.y);
        const nr = Math.min(r.x + r.width, a.x + a.width);
        const nb = Math.min(r.y + r.height, a.y + a.height);
        r = { x: nx, y: ny, width: Math.max(0, nr - nx), height: Math.max(0, nb - ny), left: nx, top: ny, right: nr, bottom: nb };
      }
      n = n.parentElement;
    }
    return r;
  }
  function push(list, el, kind, bound) {
    const r = clipRect(el);
    if (r.width <= 0 || r.height <= 0) return; /* fully clipped — paints nothing */
    const o = over(r, bound);
    if (!exceeds(o)) return;
    if (seen.has(el)) return;
    seen.add(el);
    const d = describe(el);
    d.kind = kind;
    d.over = o;
    list.push(d);
  }
  if (plaqueBox && plaque) {
    const inner = plaque.querySelectorAll(INTERACTIVE + ', p');
    for (const el of inner) {
      if (el.offsetParent === null) continue;
      push(outsidePlaque, el, 'descendant', plaqueBox);
    }
    /* Direct children too — the flex rows themselves (choices column, time
     * bar, phase tiles) are what spill below the border when the plaque is
     * height-capped. Skip the background SVG (it IS the plaque's frame). */
    for (const el of plaque.children) {
      if (el.tagName.toLowerCase() === 'svg') continue;
      if (el.offsetParent === null) continue;
      push(outsidePlaque, el, 'descendant', plaqueBox);
    }
  }
  /* Viewport pass: the dragged shell's whole subtree (companions included)
   * plus any body-level quest-owned portal. */
  const owned = new Set();
  for (const el of document.querySelectorAll('[data-hud-panel="quest"] *')) owned.add(el);
  for (const el of document.querySelectorAll('[data-quest-owned]')) {
    owned.add(el);
    for (const sub of el.querySelectorAll('*')) owned.add(sub);
  }
  for (const el of owned) {
    const isCompanion = el.hasAttribute('data-hud-companion') || (el.closest('[data-hud-companion]') === el);
    const measurable =
      el.matches(INTERACTIVE) ||
      el.tagName === 'P' ||
      el.hasAttribute('data-hud-companion') ||
      el.hasAttribute('data-testid');
    if (!measurable) continue;
    if (el.offsetParent === null) continue;
    push(outsideViewport, el, isCompanion ? 'companion' : 'questOwned', viewport);
  }
  return { phase: phaseLabel_, outsidePlaque: outsidePlaque, outsideViewport: outsideViewport };
})`;

const measureOutside = async (page: import('playwright').Page, phase: string): Promise<OutsideReport> =>
  page
    .evaluate(`(${MEASURE_OUTSIDE_SRC})(${JSON.stringify(phase)})`)
    .catch((err) => ({ phase, measureError: String(err).slice(0, 300), outsidePlaque: [], outsideViewport: [] }) as OutsideReport & { measureError?: string });

(async () => {
  const browser = await chromium.launch({ headless: true, args: GL ? [`--use-angle=${GL}`] : [] });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    ...(VIDEO ? { recordVideo: { dir: `${OUT}/video`, size: { width: WIDTH, height: HEIGHT } } } : {}),
  });
  const page = await context.newPage();
  const transcript: unknown[] = [];
  /* Crash/console witnesses (PLAN-040 T-000): a WebGL board can kill the
   * page under headless SwiftShader — silent death looks like a stalled
   * frontier, so record it explicitly. */
  page.on('crash', () => transcript.push({ crashed: true, at: Date.now() }));
  page.on('pageerror', (err) => transcript.push({ pageerror: String(err).slice(0, 300) }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') transcript.push({ consoleError: msg.text().slice(0, 300) });
  });
  const outsideReports: OutsideReport[] = [];
  /** PHASES mode: viewport shot + outsidePlaque measure, named by phase. */
  const capture = async (name: string) => {
    const phase = await phaseLabel(page);
    if (SHOTS) await page.screenshot({ path: `${OUT}/${name}-${phase}.png`, timeout: 30000 }).catch(() => undefined);
    outsideReports.push(await measureOutside(page, phase));
    writeFileSync(`${OUT}/outside.json`, JSON.stringify(outsideReports, null, 2));
  };
  const t0run = Date.now();
  let fatal: string | null = null;
  /* Gate R-189: env attestation raccolta DENTRO il run (visibilityState,
   * viewport, rAF ticks, frameDiff con sonda deliberata). */
  let env: unknown = null;
  try {
    await page.goto(`${BASE}/quest-window-lab?seed=${SEED}${REWARD ? '&reward=1' : ''}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ }).click({ timeout: 30000 });
    const win = page.locator('[data-testid="quest-window"]');
    await win.waitFor({ timeout: 15000 });
    await page.waitForTimeout(500);
    env = await collectEnvAttestation(page);
    for (let step = 0; step < 80; step++) {
    if (!(await win.count())) {
      const info = await page.evaluate(() => ({ testids: [...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')), body: document.body.innerText.slice(0, 600) }));
      writeFileSync(`${OUT}/vanished.json`, JSON.stringify(info, null, 2));
      transcript.push({ step, vanished: true });
      break;
    }
    const snap = await win.evaluate((el) => {
      const secs = [...el.children].map((c) => ({ tag: c.tagName, h: Math.round((c as HTMLElement).getBoundingClientRect().height) }));
      const theater = el.querySelector('[style*="aspect-ratio"]') as HTMLElement | null;
      const choicesBox = el.querySelector('[data-hud-choices]') as HTMLElement | null;
      const rect = el.getBoundingClientRect();
      return {
        sections: secs,
        theaterH: theater ? Math.round(theater.getBoundingClientRect().height) : 0,
        choicesH: choicesBox ? Math.round(choicesBox.getBoundingClientRect().height) : 0,
        winH: Math.round(rect.height),
        scrollH: Math.round(el.scrollHeight),
        overflow: Math.round(el.scrollHeight - el.clientHeight),
        ps: [...el.querySelectorAll('p')].map((p) => p.textContent?.trim() ?? ''),
        caption: theater?.querySelector('div:last-child')?.textContent?.trim() ?? '',
        choices: [...el.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')]
          .map((b) => b.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter((t) => t && t.length > 1),
        // PLAN-040: a locked frontier renders its choices disabled — the bot
        // must WAIT, not press keys the engine will reject.
        disabledChoices: [...el.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')].map(
          (b) => (b as HTMLButtonElement).disabled,
        ),
      };
    });
    if (SHOTS) await win.screenshot({ path: `${OUT}/step-${String(step).padStart(2, '0')}.png`, timeout: 30000 }).catch(() => undefined);
    if (PHASES) await capture(`step-${String(step).padStart(2, '0')}-view`);
    const pairs = snap.choices.map((c, i) => ({ label: c, disabled: Boolean(snap.disabledChoices?.[i]) }));
    const real = pairs.filter((p) => !/Riduci|Chiudi$|Close$/.test(p.label));
    const enabled = real.filter((p) => !p.disabled);
    transcript.push({ step, ...snap });
    writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
    if (real.some((p) => /Chiudi il rapporto|Close the report/.test(p.label))) break;
    if (!real.length) {
      // v27 frontier: a pending node exposes no choices while it matures —
      // wait for the frontier to land instead of declaring the run over.
      // Node-side polling (no in-page evaluate: tsx compiles inner functions
      // with helpers that don't exist in the browser context).
      let settled: 'choices' | 'report' | 'timeout' = 'timeout';
      const waitT0 = Date.now();
      let beatMs = 0;
      let pendingMs = 0;
      let waitShots = 0;
      const deadline = Date.now() + WAIT_MS;
      while (Date.now() < deadline) {
        const phase = await win
          .evaluate((el) => ({
            beat: !!el.querySelector('[data-testid="quest-window-beat"]'),
            /* PLAN-040 T-003b: the astrolabe lives in the #game-modal-root
             *  overlay now — outside the window element. */
            astro: !!document.querySelector('[data-testid="quest-check-overlay"]'),
            armed: !!document.querySelector('.da-tira'),
            labels: [...el.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')]
              .map((b) => b.textContent ?? '')
              .filter((s) => s && s.length > 1 && !/Riduci|Chiudi$|Close$/.test(s)),
          }))
          .catch(() => ({ beat: false, astro: false, armed: false, labels: [] as string[] }));
        /* The astrolabe arms and waits for the player's THROW — a check beat
         * is held (`checkHoldMs` leak guard) until it resolves. The bot throws
         * like a player instead of waiting the guard out. PLAN-040: after the
         * verdict paints, the overlay stays until clicked — a centre click is
         * skipToResult during the spin and dismiss once armed. */
        if (phase.armed) {
          await page.locator('.da-tira').click().catch(() => undefined);
          transcript.push({ step: `${step}-throw`, ms: Date.now() - waitT0 });
        } else if (phase.astro) {
          await page.locator('[data-testid="quest-check-overlay"]').click({ position: { x: 200, y: 200 } }).catch(() => undefined);
          transcript.push({ step: `${step}-check-click`, ms: Date.now() - waitT0 });
        }
        // Phases mode: witness what the stage shows mid-wait (a beat held on
        // checkHoldMs looks identical to a starved frontier otherwise).
        if (PHASES && Date.now() - waitT0 > (waitShots + 1) * 2500) {
          waitShots += 1;
          await capture(`step-${String(step).padStart(2, '0')}-wait-${waitShots}`);
          transcript.push({ step: `${step}-waitbeat`, beat: phase.beat, astro: phase.astro, ms: Date.now() - waitT0 });
        }
        if (phase.beat) {
          beatMs += 250;
          // --skip-beats: the bot clicks the stage like a bored player —
          // splits beat replay from frontier maturation in the budget.
          if (SKIP_BEATS) await win.locator('[data-testid="quest-window-beat"]').click().catch(() => undefined);
        } else {
          pendingMs += 250;
        }
        if (phase.labels.some((s) => /Chiudi il rapporto|Close the report/.test(s))) {
          settled = 'report';
          break;
        }
        if (phase.labels.length) {
          settled = 'choices';
          break;
        }
        await page.waitForTimeout(250);
      }
      transcript.push({ step: `${step}-wait`, settled, waitMs: Date.now() - waitT0, beatMs, pendingMs });
      if (settled !== 'choices') break;
      continue;
    }
    /* Locked frontier: the choices are rendered but disabled — time crosses
     * the frontier, not input. Wait for the unlock instead of pressing keys
     * the engine rejects. */
    if (!enabled.length) {
      transcript.push({ step: `${step}-locked` });
      await page.waitForTimeout(600);
      continue;
    }
    const idx = pick(enabled.map((p) => p.label.replace(/^\d+\.\s*/, '')));
    const t0 = Date.now();
    // The number key maps to the option's DOM position (1-based) — disabled
    // siblings still occupy a slot.
    await page.keyboard.press(String(pairs.indexOf(enabled[idx]) + 1));
    await page.waitForTimeout(BOT_SKIP_MS);
    (transcript[transcript.length - 1] as Record<string, unknown>).pressed = enabled[idx].label;
    (transcript[transcript.length - 1] as Record<string, unknown>).msToSettle = Date.now() - t0;
    }
  } catch (e) {
    fatal = String(e).slice(0, 400);
  }
  /* PLAN-040 T-000 post-run coverage (phases mode only): the phases the bot
   * loop never lands on — the MINIMISED shell and the page-level REWARD
   * popup (`?reward=1`). */
  if (PHASES) {
    try {
      const reward = page.locator('[data-testid="quest-reward-popup"]');
      if (await reward.count()) {
        await page.waitForTimeout(400);
        await capture('post-reward');
      }
    } catch {
      /* post-run coverage is best-effort */
    }
    try {
      const minToggle = page.getByRole('button', { name: /Minimi|Riduci|Minimise|Minimize/i }).first();
      if (await minToggle.count()) {
        await minToggle.click().catch(() => undefined);
        await page.waitForTimeout(300);
        await capture('post-minimised');
        const restore = page.locator('[data-testid="quest-window-minimised"] button').first();
        if (await restore.count()) await restore.click().catch(() => undefined);
      }
    } catch {
      /* minimise coverage is best-effort */
    }
  }
  // Frontier waits push entries after the in-loop write — flush once more.
  writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
  const metrics = {
    seed: SEED,
    policy: POLICY,
    botSkipMs: BOT_SKIP_MS,
    fatal,
    env,
    steps: transcript.length,
    totalWallMs: Date.now() - t0run,
    maxWinH: Math.max(0, ...transcript.map((s) => (s as { winH?: number }).winH ?? 0)),
    maxOverflow: Math.max(0, ...transcript.map((s) => (s as { overflow?: number }).overflow ?? 0)),
    maxChoicesH: Math.max(0, ...transcript.map((s) => (s as { choicesH?: number }).choicesH ?? 0)),
    /* Serie temporale per il gate (min_samples): una riga per step del run. */
    samples: transcript.map((s) => {
      const t = s as { step?: unknown; winH?: number; overflow?: number; choicesH?: number; pressed?: string };
      return { step: t.step, winH: t.winH ?? 0, overflow: t.overflow ?? 0, choicesH: t.choicesH ?? 0, pressed: t.pressed ?? null };
    }),
  };
  writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));
  await context.close();
  await browser.close();
  console.log(JSON.stringify(metrics));
})();
