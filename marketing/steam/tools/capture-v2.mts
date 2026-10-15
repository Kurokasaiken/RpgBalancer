/**
 * capture-v2.mts — Steam screenshots v2 (REVIEW-2026-10-12).
 *
 * Same real `/game?capture=1` surface and test hooks as
 * tests/e2e/idleVillage/steamCapture.spec.ts, but the page is laid out at
 * 1440×810 and rendered at deviceScaleFactor 4/3 → 1920×1080 PNGs where the
 * UI is 1.33× larger, so panels stay readable as Steam thumbnails.
 * Each shot also saves a tight crop around the open panel (for GIF framing).
 *
 * Usage: npx tsx marketing/steam/tools/capture-v2.mts
 * Requires the Vite dev server on :5173. Output: test-results/steam-capture-v2/
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = path.join(ROOT, 'test-results/steam-capture-v2');
const BASE = 'http://localhost:5173';
const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const SLOT_GUARD = `${POI}:goblin-slot-bodyguard`;

type Hooks = {
  expedition?: Record<string, Record<string, (...a: unknown[]) => unknown>>;
  advanceTicks?: (n: number) => void;
  revealQuestPois?: () => void;
};
declare global { interface Window { __idleVillageTestHooks?: Hooks } }

const exp = <T,>(page: Page, act: string, ...args: unknown[]) =>
  page.evaluate(({ act, args }) => {
    const e = window.__idleVillageTestHooks?.expedition?.['poi-goblin'];
    if (!e || typeof e[act] !== 'function') throw new Error(`hook ${act} missing`);
    return e[act](...args);
  }, { act, args }) as Promise<T>;
const ticks = (page: Page, n: number) => page.evaluate((n) => window.__idleVillageTestHooks?.advanceTicks?.(n), n);
const shot = (page: Page, name: string) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

type Run = { ended: boolean; nodeId: string; frontier: { status: string } };

const boot = async (page: Page) => {
  await page.goto(`${BASE}/game?capture=1`, { waitUntil: 'commit', timeout: 120_000 });
  await page.waitForFunction(() => window.__idleVillageTestHooks, null, { timeout: 240_000 });
  /* The world boots behind a "Preparing the world" gate (~30 s on dev): keep
   * re-revealing the offers until the POI is actually visible. */
  for (let i = 0; i < 60; i++) {
    await page.evaluate(() => window.__idleVillageTestHooks?.revealQuestPois?.());
    if (await page.locator(`[data-quest-poi-id="${POI}"]`).isVisible()) break;
    await page.waitForTimeout(2000);
  }
  await page.waitForTimeout(2500);
};

const run = async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3, locale: 'en-US' });
  const page = await ctx.newPage();
  await boot(page);
  await shot(page, 'a-map');

  await page.locator(`[data-quest-poi-id="${POI}"]`).click();
  await page.getByTestId('quest-expedition-detail').waitFor();
  /* Pick the party whose forecast is least lethal, so the shot shows a real
   * decision instead of a certain wipe. */
  const heroes = ['hero-sir-spaccaculi', 'hero-salvatrice', 'hero-giggiolillo'];
  let best: [string, string] | null = null; let bestWipe = 101;
  for (const leader of heroes) for (const member of heroes) {
    if (leader === member) continue;
    await exp(page, 'clearSlot', SLOT_LEADER); await exp(page, 'clearSlot', SLOT_MEMBER);
    await exp<boolean>(page, 'assignToSlot', SLOT_LEADER, leader).catch(() => false);
    await exp<boolean>(page, 'assignToSlot', SLOT_MEMBER, member).catch(() => false);
    await page.waitForTimeout(3000);
    const est = JSON.parse((await exp<string>(page, 'getEstimateJson')) || 'null');
    const wipe = est?.sim?.outcomePct?.wipe ?? 101;
    console.log(leader, member, JSON.stringify(est?.sim?.outcomePct));
    if (wipe < bestWipe) { bestWipe = wipe; best = [leader, member]; }
  }
  if (best) {
    await exp(page, 'clearSlot', SLOT_LEADER); await exp(page, 'clearSlot', SLOT_MEMBER);
    await exp<boolean>(page, 'assignToSlot', SLOT_LEADER, best[0]);
    await exp<boolean>(page, 'assignToSlot', SLOT_MEMBER, best[1]);
  }
  await page.waitForTimeout(6000);
  await page.waitForTimeout(4000);
  /* The planner is taller than 810 css px (known HUD issue): shoot it in a
   * 1920×1080 css viewport so the whole panel — forecast and «Send» — fits,
   * then go back to the larger-UI viewport for the rest. */
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1500);
  await shot(page, 'b-planner-forecast');
  await page.setViewportSize({ width: 1440, height: 810 });
  await page.waitForTimeout(1000);

  console.log('estimate', (await exp<string>(page, 'getEstimateJson')).slice(0, 400));
  await page.evaluate(() => (document.querySelector('[data-testid="quest-expedition-send"]') as HTMLButtonElement | null)?.click());
  await page.getByTestId('quest-window').waitFor({ timeout: 10_000 });
  let r = await exp<Run>(page, 'getRun');
  for (let i = 0; i < 40 && r && !r.ended && r.frontier.status !== 'waiting'; i++) {
    await ticks(page, 15); await page.waitForTimeout(300); r = await exp<Run>(page, 'getRun');
  }
  await page.waitForTimeout(600);
  await shot(page, 'c-quest-choice');

  let last = ''; let rep = 0; let n = 0;
  for (let i = 0; i < 120; i++) {
    /* Once the report closes the POI is consumed and its hooks disappear. */
    r = await exp<Run>(page, 'getRun').catch(() => null);
    if (!r || r.ended) break;
    if (r.frontier.status === 'waiting') {
      const opts = await exp<string[]>(page, 'getOptions');
      rep = r.nodeId === last ? rep + 1 : 0; last = r.nodeId;
      await exp<void>(page, 'choose', opts[Math.min(rep, opts.length - 1)]);
      await page.waitForTimeout(n === 1 ? 4000 : 700);
      if (n++ === 1) await shot(page, 'd-quest-consequence');
    } else { await ticks(page, 15); await page.waitForTimeout(300); }
  }
  await page.waitForTimeout(800);
  await shot(page, 'e-quest-outcome');
  await browser.close();
};

run().catch((e) => { console.error(e); process.exit(1); });
