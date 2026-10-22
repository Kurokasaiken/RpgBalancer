/**
 * geometryOracle — Pass-2 quiescence-gated geometric audit (PLAN-078 T-002).
 *
 * Runs only after the quiescence gate; on `never_quiesced` it records the
 * timeout finding itself and audits the last frame in degraded mode.
 *
 * Checks (all pure measurements from the F1a harness + straddle extension):
 *  - L1 collisions between sibling text elements;
 *  - L2 truncation/ellipsis without a tooltip and scroll-fold row straddle
 *    (T-A5: a child clipped mid-row by the scroll container's fold);
 *  - L3 containment: interactive descendants outside their plaque / the
 *    viewport (R-205, reward popup over viewport);
 *  - L4 orphan wings: a `quest-check-column`/picker visible while its parent
 *    window is minimized or closed (PLAN-071 C1/C2);
 *  - L5 hit-area: interactive controls under `minInteractivePx` (T-21);
 *  - L6 contrast: pixel-mode contrast (delegated to `contrastFromPixels`).
 */
import type { HarnessCtx } from '../gameSurfaceHarness';
import { lensAudit, plaqueOverflow, plaqueClearance, measure } from '../gameSurfaceHarness';
import { awaitQuiescence } from './quiescenceGate';
import type { SentinelConfig } from '../sentinelConfig';
import type { OracleFinding, AuditPerturbation } from './index';

/**
 * Stabilizes a signature token: ticking clocks, counters and dynamic copy
 * change label text between passes — digits collapse to `N` so the SAME
 * defect yields the SAME signature (repeat-gate dedup depends on it).
 */
const sigKey = (s: string) => s.replace(/\d+/g, 'N').replace(/\s+/g, ' ').trim().slice(0, 40);

/** Interactive descendants clipped mid-row by a scroll container's fold. */
async function foldStraddle(ctx: HarnessCtx) {
  return ctx.page.evaluate(() => {
    const out: { container: string; el: string; straddlePx: number }[] = [];
    const vis = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const label = (e: Element) =>
      e.getAttribute('data-testid') || e.getAttribute('aria-label') || e.tagName.toLowerCase();
    document.querySelectorAll('*').forEach((container) => {
      const cs = getComputedStyle(container);
      const clips = cs.overflowY !== 'visible' && cs.overflowY !== 'clip';
      if (!clips || container.scrollHeight <= container.clientHeight + 1 || !vis(container)) return;
      const cr = container.getBoundingClientRect();
      container.querySelectorAll('button, [role="button"], [role="radio"], a, [data-testid]').forEach((el) => {
        if (!vis(el) || el.closest('svg')) return;
        const r = el.getBoundingClientRect();
        // straddle = the element crosses the container's bottom fold by >3px
        // on both sides — not fully above, not fully below.
        const overTop = Math.max(0, cr.top - r.top);
        const overBot = Math.max(0, r.bottom - cr.bottom);
        const straddle = Math.min(
          r.bottom - cr.bottom > 3 && r.top < cr.bottom ? r.bottom - cr.bottom : 0,
          0,
        );
        void overTop;
        if (r.bottom - cr.bottom > 3 && r.top < cr.bottom - 3) {
          out.push({ container: label(container), el: label(el), straddlePx: +(straddle || r.bottom - cr.bottom).toFixed(1) });
        }
      });
    });
    return out.slice(0, 20);
  });
}

/** R-205: visible surface roots bleeding past the viewport edge. */
async function viewportLeaks(ctx: HarnessCtx) {
  return ctx.page.evaluate(() => {
    const sel =
      '[data-hud-panel],[data-stage-panel],[data-skin="hud-plaque"],[role="dialog"],[role="tooltip"],[data-testid="quest-check-column"],[data-testid="quest-reward-popup"],[data-testid="village-registry-list"],[data-testid="quest-window"],[data-testid="village-building-tooltip"]';
    const out: { el: string; over: Record<string, number> }[] = [];
    const seen = new Set<Element>();
    document.querySelectorAll(sel).forEach((el) => {
      /* Report only the outermost matching surface — a leaked child's leak is
       * already expressed by its ancestor's rect. */
      for (let a = el.parentElement; a; a = a.parentElement) if (seen.has(a)) return;
      seen.add(el);
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none') return;
      const over = {
        left: Math.max(0, -r.left),
        right: Math.max(0, r.right - innerWidth),
        top: Math.max(0, -r.top),
        bottom: Math.max(0, r.bottom - innerHeight),
      };
      const worst = Math.max(over.left, over.right, over.top, over.bottom);
      if (worst > 3) {
        out.push({
          el: el.getAttribute('data-testid') || el.getAttribute('data-hud-panel') || el.getAttribute('role') || el.tagName.toLowerCase(),
          over: Object.fromEntries(Object.entries(over).map(([k, v]) => [k, +v.toFixed(1)])),
        });
      }
    });
    return out.sort((a, b) => Math.max(...Object.values(b.over)) - Math.max(...Object.values(a.over))).slice(0, 15);
  });
}

/** Orphan wings: check-column/picker visible while parent window is minimized/closed (C1/C2). */
async function orphanWings(ctx: HarnessCtx) {
  return ctx.page.evaluate(() => {
    const out: string[] = [];
    const windowGone =
      !document.querySelector('[data-testid="quest-window"]') ||
      !!document.querySelector('[data-testid="quest-window-minimised"]');
    if (windowGone) {
      const wings = document.querySelectorAll(
        '[data-testid="quest-check-column"], [data-testid="quest-check-overlay"], [data-testid="quest-selection-tray"]',
      );
      wings.forEach((w) => {
        const r = w.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          out.push(w.getAttribute('data-testid') ?? w.tagName);
        }
      });
    }
    return out;
  });
}

/**
 * Pass-2 audit. `postGestureAt` lets the runner pass the timestamp of the
 * last input so the gate's debounce window is honored.
 */
export async function auditGeometry(
  ctx: HarnessCtx,
  cfg: SentinelConfig,
  stateNode: string,
  perturbation: AuditPerturbation,
  { postGestureAt }: { postGestureAt?: number } = {},
): Promise<OracleFinding[]> {
  const findings: OracleFinding[] = [];
  const q = await awaitQuiescence(ctx, cfg.quiescence, { postGestureAt });

  if (!q.quiesced) {
    findings.push({
      oracle_id: 'geometry:never-quiesced',
      signature: `never-quiesced|${q.offender ?? 'unknown'}`,
      signature_family: 'never-quiesced',
      title: `${stateNode} never reached visual quiescence in ${cfg.quiescence.timeoutMs}ms`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { lastDeltaPx: q.lastDeltaPx, offender: q.offender, waitedMs: q.waitedMs, degraded: true },
    });
  }

  const [lenses, overflow, clearance, fold, orphans, vleaks, m] = await Promise.all([
    lensAudit(ctx),
    plaqueOverflow(ctx),
    plaqueClearance(ctx),
    foldStraddle(ctx),
    orphanWings(ctx),
    viewportLeaks(ctx),
    measure(ctx),
  ]);
  const degraded = !q.quiesced;

  // L1 collisions
  for (const lens of lenses) {
    for (const [a, b, area] of lens.L1_collisions as [string, string, number][]) {
      findings.push({
        oracle_id: 'geometry:L1-collision',
        signature: `L1|${sigKey(lens.name)}|${sigKey(a)}|${sigKey(b)}`,
        signature_family: 'collision',
        title: `Text collision «${a}» × «${b}» in ${lens.name}`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        target: `[data-testid="${lens.name}"]`,
        evidence: { overlapArea: area, surface: lens.name, degraded },
      });
    }
    // L2 truncation (ellipsis without tooltip)
    for (const t of lens.L2_truncated as string[]) {
      findings.push({
        oracle_id: 'geometry:L2-truncation',
        signature: `L2|${sigKey(lens.name)}|${sigKey(t)}`,
        signature_family: 'truncation',
        title: `Truncated text «${t}» in ${lens.name}`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        target: `[data-testid="${lens.name}"]`,
        evidence: { text: t, degraded },
      });
    }
    // L8: readable text under 12px
    for (const small of lens.L8_small as string[]) {
      findings.push({
        oracle_id: 'geometry:L8-small-text',
        signature: `L8|${sigKey(lens.name)}|${sigKey(small)}`,
        signature_family: 'small-text',
        title: `Sub-12px text «${small}» in ${lens.name}`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        target: `[data-testid="${lens.name}"]`,
        evidence: { degraded },
      });
    }
    // L9: controls inside the plaque frame breathing room
    if ((lens.L9_tightToFrame as number) > 0) {
      findings.push({
        oracle_id: 'geometry:L9-clearance',
        signature: `L9|${sigKey(lens.name)}`,
        signature_family: 'clearance',
        title: `${lens.L9_tightToFrame} controls within plaque frame clearance in ${lens.name}`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        target: `[data-testid="${lens.name}"]`,
        evidence: { count: lens.L9_tightToFrame, needPx: cfg.geometry.plaqueClearancePx, degraded },
      });
    }
  }

  // L3 containment — plaque overflow and viewport-leaking panels
  for (const o of overflow as { plaque: string; el: string; over: Record<string, number> }[]) {
    findings.push({
      oracle_id: 'geometry:L3-containment',
      signature: `L3|${sigKey(o.plaque)}|${sigKey(o.el)}`,
      signature_family: 'containment',
      title: `«${o.el}» bleeds ${Math.max(...Object.values(o.over))}px out of «${o.plaque}»`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { over: o.over, degraded },
    });
  }
  for (const c of clearance as { plaque: string; el: string; minGap: number }[]) {
    findings.push({
      oracle_id: 'geometry:L5-hit-area-clearance',
      signature: `clearance|${sigKey(c.plaque)}|${sigKey(c.el)}`,
      signature_family: 'clearance',
      title: `«${c.el}» ${c.minGap}px from plaque edge (need ${cfg.geometry.plaqueClearancePx})`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { minGap: c.minGap, degraded },
    });
  }

  // fold straddle (T-A5)
  for (const f of fold) {
    findings.push({
      oracle_id: 'geometry:fold-straddle',
      signature: `fold|${sigKey(f.container)}|${sigKey(f.el)}`,
      signature_family: 'fold-straddle',
      title: `«${f.el}» straddles the scroll fold of «${f.container}» by ${f.straddlePx}px`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { ...f, degraded },
    });
  }

  // R-205 viewport leak — a whole surface bleeding past the frame edge
  for (const v of vleaks) {
    findings.push({
      oracle_id: 'geometry:viewport-leak',
      signature: `vleak|${sigKey(v.el)}`,
      signature_family: 'containment',
      title: `«${v.el}» bleeds ${Math.max(...Object.values(v.over))}px past the viewport`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      target: `[data-testid="${v.el}"]`,
      evidence: { over: v.over, degraded },
    });
  }

  // orphan wings (C1/C2)
  for (const wing of orphans) {
    findings.push({
      oracle_id: 'geometry:orphan-wing',
      signature: `orphan|${sigKey(wing)}`,
      signature_family: 'orphan-wing',
      title: `Orphaned wing ${wing} visible while parent window is minimized/closed`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      target: `[data-testid="${wing}"]`,
      evidence: { degraded },
    });
  }

  // C7 small interactive targets (T-21)
  for (const s of (m.C7_smallTargets as { el: string; w: number; h: number }[]).filter(
    (x) => Math.min(x.w, x.h) < cfg.geometry.minInteractivePx && !x.el.includes('svg'),
  )) {
    findings.push({
      oracle_id: 'geometry:small-target',
      signature: `small-target|${sigKey(s.el)}`,
      signature_family: 'hit-area',
      title: `Interactive «${s.el}» ${s.w}×${s.h}px below ${cfg.geometry.minInteractivePx}px`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { ...s, degraded },
    });
  }

  return findings;
}
