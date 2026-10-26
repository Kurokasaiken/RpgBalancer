/**
 * catalog:quest-storyboard — PLAN-086 (R-282): one real run of the goblin quest
 * captured end-to-end as a storyboard, planner → final report.
 *
 * Every frame is a full-viewport screenshot of the frozen build at 1440×900.
 * Motion is ON (`no-preference`): under reduced-motion the quest window drains
 * its beat queue, so no narrative beat and no skill check ever mounts.
 * Launch is hook-assisted (`demoLaunch`, the same declared seam as S7–S13);
 * everything after it is real input (clicks, Enter) plus `advanceTicks`.
 * A step that cannot be reached is recorded as missing — never faked.
 *
 * Usage:
 *   npx tsx scripts/catalog/questFlowStoryboard.mts --base-url http://127.0.0.1:5199
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  openGame, surfaceNode, expedition, advanceTicks, close, type HarnessCtx,
} from '../sentinel/gameSurfaceHarness';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const BASE = arg('--base-url', 'http://127.0.0.1:5199');
const OUT = path.join(process.cwd(), '.mw/ui-catalog/flows/quest/frames');
mkdirSync(OUT, { recursive: true });

interface Frame { n: number; id: string; title: string; file: string | null; note: string }
const frames: Frame[] = [];
let n = 0;

async function shot(ctx: HarnessCtx, id: string, title: string, note = ''): Promise<void> {
  n += 1;
  const file = `${String(n).padStart(2, '0')}-${id}.png`;
  await ctx.page.waitForTimeout(500);
  await ctx.page.screenshot({ path: path.join(OUT, file) });
  frames.push({ n, id, title, file, note });
  console.log('frame', file);
}
function missing(id: string, title: string, note: string): void {
  n += 1;
  frames.push({ n, id, title, file: null, note });
  console.log('MISSING', id, note);
}
const vis = (ctx: HarnessCtx, sel: string) => ctx.page.locator(sel).first().isVisible().catch(() => false);

/** Advance the run (ticks, Enter on beats) until `pred` is true or time runs out. */
async function advanceUntil(ctx: HarnessCtx, pred: () => Promise<boolean>, ms: number, opts: { enterOnBeats?: boolean; pickChoice?: boolean } = {}): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (await pred()) return true;
    /* A mounted check column owns the moment: Enter would skip the held
     * check beat, so wait for the presenter instead of driving past it. */
    if (await ctx.page.getByTestId('quest-check-column').count()) {
      await ctx.page.waitForTimeout(250);
      continue;
    }
    if (opts.enterOnBeats && (await vis(ctx, '[data-testid="quest-window-beat"]'))) {
      await ctx.page.keyboard.press('Enter');
      await ctx.page.waitForTimeout(500);
      continue;
    }
    if (opts.pickChoice && (await vis(ctx, '[data-testid="quest-window-choice"]:not([disabled])'))) {
      await ctx.page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().click();
      await ctx.page.waitForTimeout(400);
      continue;
    }
    await advanceTicks(ctx, 2);
    await ctx.page.waitForTimeout(200);
  }
  return pred();
}

async function openPill(ctx: HarnessCtx, label: string, readySel: string, id: string, title: string): Promise<void> {
  const btn = ctx.page.getByRole('button', { name: label }).first();
  if (!(await btn.isVisible().catch(() => false))) return missing(id, title, `header button «${label}» not visible`);
  await btn.click();
  if (await advanceUntil(ctx, () => vis(ctx, readySel), 4000)) await shot(ctx, id, title);
  else missing(id, title, `${readySel} not visible after clicking «${label}»`);
  await btn.click().catch(() => undefined); // close it again
}

const ctx = await openGame({ baseURL: BASE, outDir: path.join(OUT, '..'), reducedMotion: 'no-preference' });
const errors: string[] = [];
ctx.page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));

try {
  // 1 — Planner (Dispatch Table)
  await surfaceNode('S6_QuestPlanner').reach(ctx);
  await shot(ctx, 'planner', 'Planner — Dispatch Table (empty slots)', 'hook-assisted: revealQuestPois + openDetail');
  const filled = await ctx.page.evaluate(() => (window as any).__idleVillageTestHooks?.fillRequiredResidentSlots?.());
  if (filled !== undefined) await shot(ctx, 'planner-filled', 'Planner — party assigned', 'hook-assisted: fillRequiredResidentSlots');
  else missing('planner-filled', 'Planner — party assigned', 'no fillRequiredResidentSlots hook');

  // 2 — Launch and outbound leg
  await expedition(ctx, 'demoLaunch');
  await ctx.page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 30_000 });
  await shot(ctx, 'outbound', 'Run window — outbound leg', 'hook-assisted: demoLaunch');
  await shot(ctx, 'outbound-route', 'Map route during the outbound leg', 'same moment, for the on-map route');

  // 3 — Companion plaques
  await openPill(ctx, 'Assigned party', '[data-testid="quest-party-roster"]', 'party', 'Party in the field (companion plaque)');
  await openPill(ctx, 'Bag', '[data-testid="quest-belt"]', 'belt', 'Bag / belt (companion plaque)');
  await openPill(ctx, 'Chronicle', '[data-testid="quest-log-panel"]', 'chronicle', 'Chronicle (companion plaque)');

  // 4 — Narrative beat + long-form page
  if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="quest-window-beat"]'), 120_000)) await shot(ctx, 'beat', 'Narrative beat');
  else missing('beat', 'Narrative beat', 'no beat within 120s');
  if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="amanuense-open"]'), 60_000, { enterOnBeats: true })) {
    await ctx.page.getByTestId('amanuense-open').click();
    if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="amanuense-page"]'), 4000)) await shot(ctx, 'amanuense', 'Extended phase description (Amanuense folio)');
    else missing('amanuense', 'Extended phase description', 'folio did not open');
    await ctx.page.getByTestId('amanuense-close').click().catch(() => ctx.page.keyboard.press('Escape'));
  } else missing('amanuense', 'Extended phase description', 'the goblin quest has no node with a long-form page (longForm lives on the S1-lab scenario and quest blueprints, not on the demoLaunch quest)');

  // 5 — Choice
  if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="quest-window-choice"]:not([disabled])'), 120_000, { enterOnBeats: true })) await shot(ctx, 'choice', 'Choice — approaches with odds');
  else missing('choice', 'Choice', 'no enabled choice within 120s');

  // 6 — Skill check: armed → thrown → verdict → outcome toast
  if (await advanceUntil(ctx, async () => (await vis(ctx, '.da-tira')) || (await vis(ctx, '[data-testid="quest-verdict-card"]')), 240_000, { enterOnBeats: true, pickChoice: true }) && (await vis(ctx, '.da-tira'))) {
    await shot(ctx, 'check-armed', 'Skill check — armed (before the throw)');
    await ctx.page.locator('.da-tira').click();
    await ctx.page.waitForTimeout(900);
    await shot(ctx, 'check-rolling', 'Skill check — rolling', 'captured ~0.9s after the throw');
    if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="quest-verdict-card"]'), 40_000)) await shot(ctx, 'check-verdict', 'Skill check — verdict');
    else missing('check-verdict', 'Verdict', 'verdict card did not appear');
    await ctx.page.getByTestId('quest-check-column').click().catch(() => undefined);
    if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="quest-outcome-toast"]'), 6000)) await shot(ctx, 'outcome-toast', 'Outcome toast');
    else missing('outcome-toast', 'Outcome toast', 'toast not shown after dismissing the verdict (the column may consume it by design)');
  } else missing('check-armed', 'Skill check', 'no armed check within 180s');

  // 7 — Run to the end: report inside the window + external popup
  const clearVerdicts = setInterval(() => {
    ctx.page.getByTestId('quest-verdict-card').click({ timeout: 500 }).catch(() => undefined);
    ctx.page.locator('.da-tira').click({ timeout: 500 }).catch(() => undefined);
  }, 1500);
  const ended = await advanceUntil(
    ctx,
    async () => Boolean((await expedition<{ ended: boolean } | null>(ctx, 'getRun'))?.ended),
    420_000,
    { enterOnBeats: true, pickChoice: true },
  );
  clearInterval(clearVerdicts);
  if (!ended) missing('report', 'Final report', 'run did not end within 420s');
  else {
    /* The run flags `ended` before its closing beats have played: keep
     * advancing (Enter on beats) until a report is on screen. */
    await advanceUntil(ctx, async () => (await vis(ctx, '[data-testid="quest-epilogue"]')) || (await vis(ctx, '[data-testid="quest-reward-popup"]')), 60_000, { enterOnBeats: true });
    if (await vis(ctx, '[data-testid="quest-epilogue"]')) await shot(ctx, 'epilogue', 'Final report — epilogue inside the window');
    else missing('epilogue', 'Epilogue inside the window', 'quest-epilogue not visible');
    if (await advanceUntil(ctx, () => vis(ctx, '[data-testid="quest-reward-popup"]'), 15_000)) await shot(ctx, 'reward-popup', 'Final report — expedition report popup');
    else missing('reward-popup', 'Expedition report popup', 'quest-reward-popup not visible within 15s');
    if (await vis(ctx, '[data-testid="quest-returned-crew"]')) await shot(ctx, 'returned-crew', 'Who came back');
    else missing('returned-crew', 'Who came back', 'quest-returned-crew not visible');
  }
} catch (e) {
  missing('aborted', 'Run aborted', String(e).slice(0, 300));
} finally {
  writeFileSync(path.join(OUT, '..', 'storyboard.json'), JSON.stringify({ base: BASE, frames, pageErrors: errors, consoleErrors: ctx.consoleErrors.slice(0, 20) }, null, 2));
  await close(ctx);
}
