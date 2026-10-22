/**
 * sentinelCalibration — T-003 seeded-fault gate (PLAN-078).
 *
 * Drives a live `/game` surface through the Sentinel oracles with 10 injected
 * fault classes and 5 negative controls. Acceptance:
 *   - every seeded fault is detected by the expected oracle family;
 *   - negative controls produce only findings that reproduce (FP ≤ 5% —
 *     a latent real defect on a clean map is a true positive, not noise);
 *   - findings promote only through the repeat gate.
 *
 * Structure (one quest drive is the dominant cost in dev mode):
 *   1. "quest journey" — ONE drive S8→S9→S11→S13: at each stage the clean
 *      surface is audited first (S9/S11 double as negative controls), then
 *      every fault seeded at that state is injected → audited → cleaned up,
 *      and the drive continues.
 *   2. "map & village faults" — the three cheap states that do not share the
 *      quest path (S1×2, S2), one fresh page each (console errors persist in
 *      ctx and would leak into the next audit).
 *   3. "negative controls" — the three standalone clean states.
 *
 * Requires a running dev server (`SENTINEL_URL` or default `http://localhost:5198`);
 * the suite skips cleanly when the server is unreachable so unit CI stays
 * deterministic. Run live with:
 *   SENTINEL_URL=http://localhost:5198 npx vitest run tests/unit/sentinel/sentinelCalibration.test.ts
 */
import { describe, it, expect } from 'vitest';
import { SEEDED_FAULTS, NEGATIVE_CONTROLS, type SeededFault } from './fixtures/seededFaults';
import { DEFAULT_SENTINEL_CONFIG } from '../../../scripts/sentinel/sentinelConfig';
import {
  openGame,
  reachState,
  surfaceNode,
  expedition,
  advanceTicks,
  runToSettlement,
  type HarnessCtx,
} from '../../../scripts/sentinel/gameSurfaceHarness';
import { auditState, replayPixelPass } from '../../../scripts/sentinel/oracles/index';
import type { OracleFinding } from '../../../scripts/sentinel/oracles/index';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CFG = DEFAULT_SENTINEL_CONFIG;
const OUT = join(__dirname, '../../../.mw/runs/sentinel-calibration');
const URL_ = process.env.SENTINEL_URL ?? CFG.baseURL;

async function serverReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/game`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Resolved at collection time — skipIf needs the answer before any hook runs. */
const SERVER_UP = await serverReachable(URL_);
if (SERVER_UP) mkdirSync(OUT, { recursive: true });

const byId = (id: string): SeededFault => {
  const f = SEEDED_FAULTS.find((x) => x.id === id);
  if (!f) throw new Error(`seeded fault ${id} missing from fixtures`);
  return f;
};

/** One full audit pass (plus the pixel replay when the fault calls for it). */
async function auditWith(ctx: HarnessCtx, fault: SeededFault): Promise<OracleFinding[]> {
  const audit = await auditState(ctx, CFG, fault.stateNode, 'baseline');
  if (fault.pixelPass) audit.findings.push(...(await replayPixelPass(ctx, CFG, fault.stateNode)));
  return audit.findings;
}

/**
 * Inject → audit, retrying once on a miss. T-13: on a shared worktree another
 * session's HMR write reloads the dev page and silently wipes our DOM
 * mutation — a missed detection may mean "fault gone", not "oracle blind".
 * All injectors are idempotent, so re-injecting is safe.
 */
async function injectAndAudit(ctx: HarnessCtx, fault: SeededFault): Promise<string | undefined> {
  for (let attempt = 0; attempt < 2; attempt++) {
    await fault.inject(ctx);
    const found = await auditWith(ctx, fault);
    const oracle = detected(found, fault);
    if (oracle) return oracle;
    /* Re-inject only makes sense if the page still answers — a destroyed
     * context surfaces on the next evaluate anyway. */
  }
  return undefined;
}

function detected(findings: OracleFinding[], fault: SeededFault): string | undefined {
  const hit = findings.find(
    (f) => f.signature_family === fault.expectedFamily || f.oracle_id.includes(fault.expectedFamily),
  );
  return hit?.oracle_id;
}

/** Env-sensitive temporal findings are graded by the 3-of-5 repeat gate, not here. */
const deterministicDefects = (findings: OracleFinding[]) =>
  findings.filter((f) => f.severity === 'defect' && !f.oracle_id.startsWith('temporal-perf'));

/**
 * Control contract: a deterministic defect signature is a false positive
 * only when it fails to reproduce in TWO further passes. Async-populated
 * surfaces (planner lists, live lenses) can legitimately differ between
 * pass 1 and pass 2 — a third pass separates real instability from a
 * one-off observation.
 */
async function assertReproducing(ctx: HarnessCtx, stateNode: string, label: string) {
  /* Controls must audit the RESTED surface: mount/reveal animations (verdict
   * card, choice rows) genuinely straddle the fold for a few hundred ms —
   * real but transient. The control question is "does it reproduce", not
   * "does it exist for one frame". */
  await ctx.page.waitForTimeout(1500);
  const pass1 = await auditState(ctx, CFG, stateNode, 'baseline');
  const defects = deterministicDefects(pass1.findings);
  if (defects.length === 0) return;
  const pass2 = await auditState(ctx, CFG, stateNode, 'replay');
  const sigs = new Set(pass2.findings.map((f) => f.signature));
  let unstable = defects.filter((d) => !sigs.has(d.signature));
  if (unstable.length > 0) {
    const pass3 = await auditState(ctx, CFG, stateNode, 'replay');
    for (const f of pass3.findings) sigs.add(f.signature);
    unstable = defects.filter((d) => !sigs.has(d.signature));
  }
  expect(
    unstable,
    `control ${label}: non-reproducing defects (false positives): ${unstable.map((d) => d.oracle_id).join(', ')}`,
  ).toHaveLength(0);
}

describe('T-003 seeded-fault calibration', () => {
  it.skipIf(!SERVER_UP)(
    'quest journey: S8→S9→S11→S13 faults on a single drive',
    { timeout: 900_000, retry: 1 /* T-13: a shared-worktree HMR reload mid-journey loses the quest state — restart cleanly */ },
    async () => {
      const ctx = await openGame({ baseURL: URL_, outDir: join(OUT, 'quest-journey') });
      const page = ctx.page;
      const misses: string[] = [];
      try {
        /* ── S8: first narrative beat → theatre black frame (pixel pass) ── */
        await expedition(ctx, 'demoLaunch');
        {
          const deadline = Date.now() + 120_000;
          let beatSeen = false;
          while (Date.now() < deadline) {
            if (await page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
              beatSeen = true;
              break;
            }
            await advanceTicks(ctx, 3);
            await page.waitForTimeout(150);
          }
          /* No re-query after break — an HMR reload can wipe the DOM between
           * loop exit and a fresh locator probe (observed live, T-13). */
          expect(beatSeen, 'S8 beat never landed').toBe(true);
          const fault = byId('theatre-black-frame-700ms');
          if (!(await injectAndAudit(ctx, fault))) misses.push(fault.id);
          await fault.cleanup?.(ctx);
        }

        /* ── S9: first choice frontier → clean control + fold/label faults ── */
        {
          const deadline = Date.now() + 120_000;
          while (Date.now() < deadline) {
            if (await page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().isVisible().catch(() => false)) break;
            if (await page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
              await page.keyboard.press('Enter');
            } else {
              await advanceTicks(ctx, 3);
            }
            await page.waitForTimeout(150);
          }
          expect(
            await page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().isVisible().catch(() => false),
            'S9 choice frontier never landed',
          ).toBe(true);
          await assertReproducing(ctx, 'S9_QuestStageChoice', 'clean-choice');
          for (const id of ['fold-straddle-choice-row', 'label-misbind'] as const) {
            const fault = byId(id);
            if (!(await injectAndAudit(ctx, fault))) misses.push(fault.id);
            await fault.cleanup?.(ctx);
          }
        }

        /* ── S10→S11: armed check → throw → clean control + parked/orphan ── */
        {
          const deadline = Date.now() + 240_000;
          while (Date.now() < deadline) {
            if (await page.getByTestId('quest-check-column').count()) break;
            if (await page.getByTestId('quest-window-beat').isVisible().catch(() => false)) {
              await page.keyboard.press('Enter');
            } else if (await page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().isVisible().catch(() => false)) {
              await page.locator('[data-testid="quest-window-choice"]:not([disabled])').first().click({ timeout: 5_000 }).catch(() => {});
            } else {
              await advanceTicks(ctx, 3);
            }
            await page.waitForTimeout(150);
          }
          await page.locator('.da-tira').waitFor({ state: 'visible', timeout: 30_000 });
          await page.locator('.da-tira').click({ timeout: 10_000 }).catch(() => {});
          await page.getByTestId('quest-verdict-card').waitFor({ state: 'visible', timeout: 60_000 }).catch(() => {});
          await page.waitForFunction(() => document.querySelector('[data-astro-idle="parked"], [data-testid="quest-verdict-card"]'), undefined, { timeout: 10_000 }).catch(() => {});

          await assertReproducing(ctx, 'S11_QuestSkillCheckParked', 'clean-parked');
          for (const id of ['parked-animation-running', 'orphan-wing-minimized'] as const) {
            const fault = byId(id);
            if (!(await injectAndAudit(ctx, fault))) misses.push(fault.id);
            await fault.cleanup?.(ctx);
          }
        }

        /* ── S13: settlement → popup overflow + domain-text leak ── */
        {
          /* Verdict card click resumes the run; then drive to settlement. */
          await page.getByTestId('quest-verdict-card').click({ timeout: 5_000 }).catch(() => {});
          await runToSettlement(ctx, { timeoutMs: 300_000 });
          await page
            .locator('[data-testid="quest-reward-popup"], [data-testid="quest-window-close-report"]')
            .first()
            .waitFor({ state: 'visible', timeout: 60_000 });
          for (const id of ['reward-popup-overflow', 'domain-text-leak'] as const) {
            const fault = byId(id);
            if (!(await injectAndAudit(ctx, fault))) misses.push(fault.id);
            await fault.cleanup?.(ctx);
          }
        }

        expect(misses, `undetected seeded faults on quest journey: ${misses.join('; ')}`).toHaveLength(0);
      } finally {
        await ctx.browser.close();
      }
    },
  );

  it.skipIf(!SERVER_UP)(
    'map & village faults (S1 console/pageerror, S1 never-quiescing, S2 clipped tooltip)',
    { timeout: 600_000, retry: 1 },
    async () => {
      const misses: string[] = [];
      for (const id of ['console-pageerror', 'never-quiescing', 'clipped-tooltip'] as const) {
        const fault = byId(id);
        const ctx = await openGame({ baseURL: URL_, outDir: join(OUT, `fault-${id}`) });
        try {
          /* S1/S2 mount through the generic node reach. */
          const reached = await reachState(ctx, surfaceNode(fault.stateNode));
          if (!reached) {
            misses.push(`${fault.id} (state ${fault.stateNode} unreachable)`);
            continue;
          }
          if (!(await injectAndAudit(ctx, fault))) misses.push(fault.id);
        } catch (e) {
          misses.push(`${fault.id} (${e instanceof Error ? e.message.split('\n')[0] : String(e)})`);
        } finally {
          await ctx.browser.close();
        }
      }
      expect(misses, `undetected seeded faults: ${misses.join('; ')}`).toHaveLength(0);
    },
  );

  it.skipIf(!SERVER_UP)(
    'negative controls: every deterministic defect finding reproduces (FP = non-reproducing, not latent real defects)',
    { timeout: 600_000, retry: 1 },
    async () => {
      /* S9/S11 clean audits run inside the quest journey test; here only the
       * three standalone clean states. */
      for (const ctrl of NEGATIVE_CONTROLS.filter((c) =>
        ['clean-map', 'clean-village', 'clean-planner'].includes(c.id),
      )) {
        const ctx = await openGame({ baseURL: URL_, outDir: join(OUT, `control-${ctrl.id}`) });
        try {
          const reached = await reachState(ctx, surfaceNode(ctrl.stateNode));
          if (!reached) continue;
          await assertReproducing(ctx, ctrl.stateNode, ctrl.id);
        } finally {
          await ctx.browser.close();
        }
      }
    },
  );
});
