/**
 * seededFaults — deterministic in-page fault mutators for the calibration
 * suite (PLAN-078 T-003).
 *
 * Each fault reproduces a real defect class observed in PLAN-067/071 audits
 * or R-2xx reports. Mutators run inside the live `/game` page before a
 * Sentinel pass; the oracle under test must detect them, and the negative
 * controls (unmutated states) must produce zero defect-severity findings.
 *
 * `SEEDED_FAULTS` maps the 10 seeded classes to (state node, mutator,
 * expected oracle family). `NEGATIVE_CONTROLS` are clean states that must
 * stay clean.
 */
import type { HarnessCtx } from '../../../../scripts/sentinel/gameSurfaceHarness';

export interface SeededFault {
  id: string;
  /** State node where the fault is injected. */
  stateNode: string;
  /** Oracle family expected to catch it (signature_family prefix). */
  expectedFamily: string;
  /** Whether Pass-1b (pixel replay) is the intended detector. */
  pixelPass?: boolean;
  /** Applies the mutation in-page. Must be deterministic. */
  inject: (ctx: HarnessCtx) => Promise<void>;
  /** Reverts the mutation so a journey can continue (calibration only). */
  cleanup?: (ctx: HarnessCtx) => Promise<void>;
}

/** Injects raw CSS/DOM tampering inside the live page. */
async function evalInPage(ctx: HarnessCtx, fn: (arg?: never) => void, arg?: unknown): Promise<void> {
  await ctx.page.evaluate(fn as any, arg as any);
}

export const SEEDED_FAULTS: SeededFault[] = [
  {
    id: 'reward-popup-overflow',
    stateNode: 'S13_QuestRewardPopup',
    expectedFamily: 'containment',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        const p = document.querySelector('[data-testid="quest-reward-popup"]') as HTMLElement | null;
        if (p) {
          p.style.maxHeight = 'none';
          p.style.height = `${innerHeight * 1.4}px`;
        }
      }),
  },
  {
    id: 'theatre-black-frame-700ms',
    stateNode: 'S8_QuestStageNarrative',
    expectedFamily: 'black-frame',
    pixelPass: true,
    inject: (ctx) =>
      evalInPage(ctx, () => {
        /* The oracle measures WHOLE-FRAME dark fraction ≥90% for >300ms
         * (T-A4 = theatre art decoding black). A fullscreen opaque overlay
         * reproduces exactly that; it must persist through audit+pixel pass
         * (~seconds), so it never restores inside this run. */
        const veil = document.createElement('div');
        veil.id = 'sentinel-blackframe';
        veil.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2147483647;';
        document.body.appendChild(veil);
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        document.getElementById('sentinel-blackframe')?.remove();
      }),
  },
  {
    id: 'fold-straddle-choice-row',
    stateNode: 'S9_QuestStageChoice',
    expectedFamily: 'fold-straddle',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        const row = document.querySelector('[data-testid="quest-window-choice"]') as HTMLElement | null;
        const scroller = row?.closest('[style*="overflow"], [class*="scroll"]') as HTMLElement | null;
        if (row && scroller) {
          const cr = scroller.getBoundingClientRect();
          const r = row.getBoundingClientRect();
          // nudge the row so its bottom crosses the fold mid-row
          row.style.transform = `translateY(${cr.bottom - r.top - r.height / 2}px)`;
          row.setAttribute('data-sentinel-fold', '1');
        }
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        const row = document.querySelector('[data-sentinel-fold="1"]') as HTMLElement | null;
        if (row) {
          row.style.transform = '';
          row.removeAttribute('data-sentinel-fold');
        }
      }),
  },
  {
    id: 'domain-text-leak',
    stateNode: 'S13_QuestRewardPopup',
    expectedFamily: 'domain-text',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        const target = document.querySelector('[data-testid="quest-reward-popup"] [data-testid], [data-testid="quest-reward-popup"]') as HTMLElement | null;
        if (target) target.textContent = `slot-token:chest +15pp ${target.textContent ?? ''}`;
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        const target = document.querySelector('[data-testid="quest-reward-popup"] [data-testid], [data-testid="quest-reward-popup"]') as HTMLElement | null;
        if (target) target.textContent = (target.textContent ?? '').replace('slot-token:chest +15pp ', '');
      }),
  },
  {
    id: 'orphan-wing-minimized',
    stateNode: 'S11_QuestSkillCheckParked',
    expectedFamily: 'orphan-wing',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        // parent window minimized, wing left mounted — the C1 fault. The
        // detector fires on the MINIMISED marker too, so the journey keeps
        // its real quest-window alive (cleanup restores, run continues).
        const win = document.querySelector('[data-testid="quest-window"]') as HTMLElement | null;
        if (win) {
          win.setAttribute('data-testid', 'quest-window-minimised');
        }
        let wing = document.querySelector('[data-testid="quest-check-column"]') as HTMLElement | null;
        if (!wing) {
          wing = document.createElement('div');
          wing.setAttribute('data-testid', 'quest-check-column');
          wing.setAttribute('data-sentinel-wing', '1');
          wing.style.cssText = 'position:fixed;left:20px;top:20px;width:120px;height:200px;background:#123;z-index:9999;';
          document.body.appendChild(wing);
        } else {
          wing.style.display = '';
        }
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        const win = document.querySelector('[data-testid="quest-window-minimised"]') as HTMLElement | null;
        if (win) win.setAttribute('data-testid', 'quest-window');
        document.querySelector('[data-sentinel-wing="1"]')?.remove();
        const wing = document.querySelector('[data-testid="quest-check-column"]') as HTMLElement | null;
        if (wing) wing.style.display = 'none';
      }),
  },
  {
    id: 'parked-animation-running',
    stateNode: 'S11_QuestSkillCheckParked',
    expectedFamily: 'parked-animation',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        /* S11's ready signal also accepts the verdict card, so the astro
         * marker may be absent — park the body as the deterministic fallback. */
        const astro =
          (document.querySelector('[data-astro-idle]') as HTMLElement | null) ?? document.body;
        astro.setAttribute('data-astro-idle', 'parked');
        const el = document.createElement('div');
        el.setAttribute('data-testid', 'sentinel-seeded-anim');
        el.style.cssText = 'position:absolute;width:10px;height:10px;background:red;animation:sentinel-spin 1s linear infinite;';
        const style = document.createElement('style');
        style.setAttribute('data-sentinel-anim-style', '1');
        style.textContent = '@keyframes sentinel-spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(style);
        document.body.appendChild(el);
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        document.querySelector('[data-sentinel-anim-style]')?.remove();
        document.querySelector('[data-testid="sentinel-seeded-anim"]')?.remove();
        document.querySelectorAll('[data-astro-idle="parked"]').forEach((e) => e.removeAttribute('data-astro-idle'));
      }),
  },
  {
    id: 'label-misbind',
    stateNode: 'S9_QuestStageChoice',
    expectedFamily: 'hit-area',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        const btn = document.querySelector('button[aria-label], [role="button"][aria-label]') as HTMLElement | null;
        if (btn) {
          btn.setAttribute('aria-label', 'WRONG LABEL');
          btn.style.width = '12px';
          btn.style.height = '12px';
          btn.setAttribute('data-sentinel-misbind', '1');
        }
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        const btn = document.querySelector('[data-sentinel-misbind="1"]') as HTMLElement | null;
        if (btn) {
          btn.removeAttribute('aria-label');
          btn.style.width = '';
          btn.style.height = '';
          btn.removeAttribute('data-sentinel-misbind');
        }
      }),
  },
  {
    id: 'clipped-tooltip',
    stateNode: 'S2_VillageView',
    expectedFamily: 'containment',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        /* The tooltip only exists while hovering a building — synthesize it
         * when absent so the containment detector is always exercised. */
        let tip = document.querySelector('[data-testid="village-building-tooltip"]') as HTMLElement | null;
        if (!tip) {
          tip = document.createElement('div');
          tip.setAttribute('data-testid', 'village-building-tooltip');
          tip.setAttribute('data-sentinel-tip', '1');
          document.body.appendChild(tip);
        }
        tip.style.position = 'fixed';
        tip.style.left = `${innerWidth - 10}px`;
        tip.style.top = '10px';
        tip.style.width = '300px';
        tip.style.height = '40px';
      }),
    cleanup: (ctx) =>
      evalInPage(ctx, () => {
        document.querySelector('[data-sentinel-tip="1"]')?.remove();
        const tip = document.querySelector('[data-testid="village-building-tooltip"]') as HTMLElement | null;
        if (tip) tip.style.cssText = '';
      }),
  },
  {
    id: 'console-pageerror',
    stateNode: 'S1_WorldMapIdle',
    expectedFamily: 'runtime',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        console.error('SENTINEL-SEEDED console error');
        setTimeout(() => { throw new Error('SENTINEL-SEEDED pageerror'); }, 0);
      }),
  },
  {
    id: 'never-quiescing',
    stateNode: 'S1_WorldMapIdle',
    expectedFamily: 'never-quiesced',
    inject: (ctx) =>
      evalInPage(ctx, () => {
        /* First match can be a hidden plaque (rect 0 — skipped by the gate's
         * probe); pick the first VISIBLE surface element. */
        let el = [...document.querySelectorAll('[data-skin="hud-plaque"], [data-hud-panel]')].find((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 1 && r.height > 1;
        }) as HTMLElement | undefined;
        if (!el) {
          /* No audited surface visible at this state — inject one inside the
           * gate's SURFACE_SEL so the detector is still exercised. */
          el = document.createElement('div');
          el.setAttribute('data-hud-panel', 'sentinel-seeded-wobble');
          el.style.cssText = 'position:fixed;left:8px;top:8px;width:80px;height:40px;z-index:9999;';
          document.body.appendChild(el);
        }
        if (el) {
          /* Sawtooth drift, period ≠ gate sampling: an ±N alternating wobble
           * aliases to delta 0 when consecutiveTicks shares its period (the
           * probe compares endpoints N ticks apart). +6px/frame mod 30 gives
           * 12px or −24px on every 2-tick window — always above the 0.5px
           * epsilon. */
          let f = 0;
          const step = () => {
            f = (f + 1) % 6;
            el.style.transform = `translateX(${f * 6}px)`;
          };
          const wobble = () => {
            step();
            requestAnimationFrame(wobble);
          };
          requestAnimationFrame(wobble);
          /* rAF can throttle on a loaded headless page — setInterval keeps
           * the rect moving so the gate's probe always sees a delta. */
          setInterval(step, 50);
        }
      }),
  },
];

/** Clean states that must produce zero defect-severity findings. */
export const NEGATIVE_CONTROLS: { id: string; stateNode: string }[] = [
  { id: 'clean-map', stateNode: 'S1_WorldMapIdle' },
  { id: 'clean-village', stateNode: 'S2_VillageView' },
  { id: 'clean-planner', stateNode: 'S6_QuestPlanner' },
  { id: 'clean-choice', stateNode: 'S9_QuestStageChoice' },
  { id: 'clean-parked', stateNode: 'S11_QuestSkillCheckParked' },
];
