/**
 * catalog:planner-storyboard — PLAN-086 (R-282): the quest planner («Dispatch
 * Table») driven like a player: four heroes DRAGGED from the roster onto the
 * marching-order slots (real pointer drag through dnd-kit), the bag packed by
 * clicks, then the real «Send expedition» button. Opening the planner is the
 * declared seam (`revealQuestPois` + `openDetail`); everything after is input.
 *
 * Usage:
 *   npx tsx scripts/catalog/questPlannerStoryboard.mts --base-url http://127.0.0.1:5199
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openGame, surfaceNode, expedition, close, type HarnessCtx } from '../sentinel/gameSurfaceHarness';

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const BASE = arg('--base-url', 'http://127.0.0.1:5199');
const OUT = path.join(process.cwd(), '.mw/ui-catalog/flows/quest-planner/frames');
mkdirSync(OUT, { recursive: true });

const frames: { n: number; id: string; title: string; file: string | null; note: string }[] = [];
let n = 0;
async function shot(ctx: HarnessCtx, id: string, title: string, note = '') {
  n += 1;
  const file = `${String(n).padStart(2, '0')}-${id}.png`;
  await ctx.page.waitForTimeout(600);
  await ctx.page.screenshot({ path: path.join(OUT, file) });
  frames.push({ n, id, title, file, note });
  console.log('frame', file, note);
}
function missing(id: string, title: string, note: string) {
  n += 1;
  frames.push({ n, id, title, file: null, note });
  console.log('MISSING', id, note);
}

/** Real pointer drag: press on the card, move in steps past the sensor's
 *  activation distance, hover the slot, release. */
async function drag(ctx: HarnessCtx, from: string, to: string): Promise<boolean> {
  const a = await ctx.page.locator(from).first().boundingBox();
  const b = await ctx.page.locator(to).first().boundingBox();
  if (!a || !b) return false;
  const m = ctx.page.mouse;
  await m.move(a.x + a.width / 2, a.y + a.height / 2);
  await m.down();
  await m.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 6, { steps: 4 });
  await m.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 18 });
  await ctx.page.waitForTimeout(250);
  await m.up();
  await ctx.page.waitForTimeout(700);
  return true;
}

const ctx = await openGame({ baseURL: BASE, outDir: path.join(OUT, '..'), reducedMotion: 'no-preference' });
const errors: string[] = [];
ctx.page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
const log: string[] = [];

try {
  await surfaceNode('S6_QuestPlanner').reach(ctx);
  await shot(ctx, 'empty', 'Planner — nothing assigned', 'seam: revealQuestPois + openDetail');

  const slots = await ctx.page.locator('[data-testid^="slot-button-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!));
  const cards = await ctx.page.locator('[data-resident-id]').evaluateAll((els) => els.map((e) => e.getAttribute('data-resident-id')!));
  log.push(`slots=${slots.join(',')}`, `cards=${cards.join(',')}`);

  const used = new Set<string>();
  for (const slot of slots) {
    let placed = false;
    for (const id of cards) {
      if (used.has(id)) continue;
      await drag(ctx, `[data-resident-id="${id}"]`, `[data-testid="${slot}"]`);
      const assignments = (await expedition<Record<string, string>>(ctx, 'getAssignments')) ?? {};
      if (Object.values(assignments).includes(id)) {
        used.add(id);
        placed = true;
        log.push(`${slot} <- ${id}`);
        break;
      }
      log.push(`${slot} rejected ${id}`);
    }
    if (!placed) log.push(`${slot}: nobody accepted`);
    await shot(ctx, `after-${slot.replace('slot-button-', '')}`, `Planner — after dragging onto ${slot.replace('slot-button-', '')}`, placed ? 'assigned by real drag' : 'no eligible hero landed');
  }

  // Bag: open the items tray and pick what is offered (real clicks).
  const bag = ctx.page.getByTestId('quest-tray-mode-items');
  if (await bag.isVisible().catch(() => false)) await bag.click();
  else await ctx.page.getByRole('button', { name: /bag/i }).first().click().catch(() => undefined);
  await ctx.page.waitForTimeout(500);
  const pickers = ctx.page.locator('[data-testid^="picker-item-"]');
  const count = await pickers.count();
  for (let i = 0; i < Math.min(count, 3); i++) await pickers.nth(i).click().catch(() => undefined);
  if (count) await shot(ctx, 'bag', 'Planner — bag packed', `${Math.min(count, 3)} item(s) picked by click`);
  else missing('bag', 'Planner — bag', 'no item picker visible');
  await ctx.page.getByTestId('quest-tray-close').click().catch(() => undefined);

  await shot(ctx, 'ready', 'Planner — ready to send (forecast filled)');
  // Hover the first member row of the forecast to light its slot.
  const member = ctx.page.locator('[data-testid^="forecast-member-"]').first();
  if (await member.isVisible().catch(() => false)) {
    await member.hover();
    await shot(ctx, 'member-hover', 'Planner — hovering a member in the forecast', 'lights the matching marching-order slot');
  }

  const send = ctx.page.getByRole('button', { name: /send expedition/i }).first();
  if (await send.isEnabled().catch(() => false)) {
    await send.click();
    await ctx.page.getByTestId('quest-window').waitFor({ state: 'visible', timeout: 30_000 });
    await shot(ctx, 'launched', 'Run window after the real Send');
    const party = ctx.page.getByRole('button', { name: 'Assigned party' }).first();
    if (await party.isVisible().catch(() => false)) {
      await party.click();
      await ctx.page.getByTestId('quest-party-roster').waitFor({ state: 'visible', timeout: 6000 }).catch(() => undefined);
      await shot(ctx, 'party-4', 'Party in the field — four heroes');
    }
  } else missing('launched', 'Send expedition', 'button not enabled');
} catch (e) {
  missing('aborted', 'Run aborted', String(e).slice(0, 300));
} finally {
  writeFileSync(path.join(OUT, '..', 'storyboard.json'), JSON.stringify({ base: BASE, frames, log, pageErrors: errors }, null, 2));
  await close(ctx);
}
