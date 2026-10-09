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
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

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
const BASE = arg('base', 'http://localhost:5173')!;
mkdirSync(OUT, { recursive: true });

/** Bot policies: which numbered option the player prefers at each bivio. */
const POLICIES: Record<string, RegExp[]> = {
  greedy: [/Arrampicarsi/, /Prendere il bottino/, /Furtiv|silenzio|Stealth/i, /Incalz|Insegu/i, /Frugare|Cercare ancora/i, /Combatti/, /Razzia/],
  cautious: [/Tornare|Ritir|Indietro|Casa/i, /Cercare tracce/, /Furtiv|silenzio/i, /Combatti/],
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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(VIDEO ? { recordVideo: { dir: `${OUT}/video`, size: { width: 1440, height: 900 } } } : {}),
  });
  const page = await context.newPage();
  const transcript: unknown[] = [];
  const t0run = Date.now();
  let fatal: string | null = null;
  try {
    await page.goto(`${BASE}/quest-window-lab?seed=${SEED}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Avvia quest goblin|Start goblin quest/ }).click({ timeout: 30000 });
    const win = page.locator('[data-testid="quest-window"]');
    await win.waitFor({ timeout: 15000 });
    await page.waitForTimeout(500);
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
      };
    });
    if (SHOTS) await win.screenshot({ path: `${OUT}/step-${String(step).padStart(2, '0')}.png`, timeout: 30000 }).catch(() => undefined);
    const real = snap.choices.filter((c) => !/Riduci|Chiudi$|Close$/.test(c));
    transcript.push({ step, ...snap });
    writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
    if (real.some((c) => /Chiudi il rapporto|Close the report/.test(c))) break;
    if (!real.length) {
      // v27 frontier: a pending node exposes no choices while it matures —
      // wait for the frontier to land instead of declaring the run over.
      // Node-side polling (no in-page evaluate: tsx compiles inner functions
      // with helpers that don't exist in the browser context).
      let settled: 'choices' | 'report' | 'timeout' = 'timeout';
      const waitT0 = Date.now();
      let beatMs = 0;
      let pendingMs = 0;
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline) {
        const phase = await win
          .evaluate((el) => ({
            beat: !!el.querySelector('[data-testid="quest-window-beat"]'),
            labels: [...el.querySelectorAll('[data-hud-choices] button[data-skin="choice"]')]
              .map((b) => b.textContent ?? '')
              .filter((s) => s && s.length > 1 && !/Riduci|Chiudi$|Close$/.test(s)),
          }))
          .catch(() => ({ beat: false, labels: [] as string[] }));
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
    const idx = pick(real.map((c) => c.replace(/^\d+\.\s*/, '')));
    const t0 = Date.now();
    await page.keyboard.press(String(idx + 1));
    await page.waitForTimeout(BOT_SKIP_MS);
    (transcript[transcript.length - 1] as Record<string, unknown>).pressed = real[idx];
    (transcript[transcript.length - 1] as Record<string, unknown>).msToSettle = Date.now() - t0;
    }
  } catch (e) {
    fatal = String(e).slice(0, 400);
  }
  // Frontier waits push entries after the in-loop write — flush once more.
  writeFileSync(`${OUT}/transcript.json`, JSON.stringify(transcript, null, 2));
  const metrics = {
    seed: SEED,
    policy: POLICY,
    botSkipMs: BOT_SKIP_MS,
    fatal,
    steps: transcript.length,
    totalWallMs: Date.now() - t0run,
    maxWinH: Math.max(0, ...transcript.map((s) => (s as { winH?: number }).winH ?? 0)),
    maxOverflow: Math.max(0, ...transcript.map((s) => (s as { overflow?: number }).overflow ?? 0)),
    maxChoicesH: Math.max(0, ...transcript.map((s) => (s as { choicesH?: number }).choicesH ?? 0)),
  };
  writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));
  await context.close();
  await browser.close();
  console.log(JSON.stringify(metrics));
})();
